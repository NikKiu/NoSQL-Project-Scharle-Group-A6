import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { MongoService } from '../mongo.service';
import { RequestUser } from '../common/auth/auth.types';
import { parseDate, parseOptionalDate } from '../common/utils/parse';
import * as AggPipeline from '../pipeline/aggregatedData';
import { createId } from '../common/utils/id';
import { ensureString } from '../common/utils/parse';

@Injectable()
export class AdminService {
  constructor(private readonly mongoService: MongoService) {}

  private hashPassword(password: string): string {
    const pepper = process.env.AUTH_PASSWORD_PEPPER || 'dev-pepper';
    return createHash('sha256').update(`${pepper}:${password}`).digest('hex');
  }

  /** Wirft 403, wenn der anfragende Nutzer kein Admin ist. */
  private requireAdmin(user: RequestUser): void {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Dieser Endpunkt ist nur für Administratoren zugänglich');
    }
  }

  /** F14, F16, NF1, NF3 – US 8: Schreibrate & Latenz überwachen */
  async getSystemMetrics(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    const intervalMinutes = Number(query.intervalMinutes) || 5;
    return AggPipeline.getSystemMetrics(this.mongoService.getDb(), from, to, intervalMinutes);
  }

  /** NF1, NF3, F14 – US 8: Schreib-Performance überwachen */
  async getWritePerformance(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    const groupByMinutes = Number(query.groupByMinutes) || 1;
    return AggPipeline.getWritePerformanceMetrics(this.mongoService.getDb(), from, to, groupByMinutes);
  }

  /** F15, F23, NF7 – US 11: Audit-Logs einsehen */
  async getAuditLogs(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    return AggPipeline.getAuditLogSummary(this.mongoService.getDb(), from, to, query.action);
  }

  /** F13, F16 – US 9, US 12: Sensortypen-Statistiken */
  async getSensorTypeStats(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');
    return AggPipeline.getSensorTypeUsageStats(this.mongoService.getDb(), from, to);
  }

  /** F16 – US 12: Datenvolumen pro Sportart */
  async getDataVolumePerSport(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');
    return AggPipeline.getDataVolumePerSport(this.mongoService.getDb(), from, to);
  }

  /** F12, F23, NF7 – US 10: Nutzerverwaltung */
  async getUsers(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const filter: any = {};
    if (query.role) filter.role = query.role;
    return this.mongoService
      .getDb()
      .collection('users')
      .find(filter, { projection: { _id: 0, passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getSensorCatalog(user: RequestUser) {
    return this.mongoService
      .getDb()
      .collection('sensor_types')
      .find({}, { projection: { _id: 0 } })
      .sort({ sensorType: 1 })
      .toArray();
  }

  async createUser(body: any, user: RequestUser) {
    this.requireAdmin(user);

    const role = ensureString(body.role, 'role');
    if (!['admin', 'trainer', 'athlete'].includes(role)) {
      throw new BadRequestException('Invalid role. Allowed values: admin, trainer, athlete');
    }

    const email = ensureString(body.email, 'email').toLowerCase();
    const password = ensureString(body.password, 'password');
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const users = this.mongoService.getDb().collection('users');
    const exists = await users.findOne({ email });
    if (exists) {
      throw new BadRequestException('A user with this email already exists');
    }

    const now = new Date();
    const userId = createId(role);
    const createdUser = {
      id: userId,
      userId,
      email,
      role,
      name: body.name?.toString().trim() || email.split('@')[0],
      passwordHash: this.hashPassword(password),
      trainerAthleteIds: Array.isArray(body.trainerAthleteIds) ? body.trainerAthleteIds : [],
      athleteId: role === 'athlete' ? body.athleteId?.toString().trim() || createId('athlete') : null,
      createdAt: now,
      updatedAt: now
    };

    await users.insertOne(createdUser as any);
    const { passwordHash: _ignored, ...publicUser } = createdUser as any;
    return { created: true, user: publicUser };
  }

  async upsertSensorType(body: any, user: RequestUser) {
    this.requireAdmin(user);

    const sensorType = ensureString(body.sensorType ?? body.type, 'sensorType');
    const allowedGeneratorTypes = new Set(['heart-rate', 'gps', 'power', 'custom']);
    const rawGeneratorType = body.generatorType?.toString().trim();
    const generatorType = rawGeneratorType && rawGeneratorType.length > 0 ? rawGeneratorType : undefined;

    if (generatorType && !allowedGeneratorTypes.has(generatorType)) {
      throw new BadRequestException('generatorType must be one of: heart-rate, gps, power, custom');
    }

    const rawConfig = body.generatorConfig;
    const generatorConfig = rawConfig && typeof rawConfig === 'object' && !Array.isArray(rawConfig)
      ? {
          metricKey: rawConfig.metricKey?.toString().trim() || undefined,
          base: Number.isFinite(Number(rawConfig.base)) ? Number(rawConfig.base) : undefined,
          amplitude: Number.isFinite(Number(rawConfig.amplitude)) ? Number(rawConfig.amplitude) : undefined,
          noise: Number.isFinite(Number(rawConfig.noise)) ? Number(rawConfig.noise) : undefined,
          min: Number.isFinite(Number(rawConfig.min)) ? Number(rawConfig.min) : undefined,
          max: Number.isFinite(Number(rawConfig.max)) ? Number(rawConfig.max) : undefined,
          frequencyDivisor: Number.isFinite(Number(rawConfig.frequencyDivisor)) ? Number(rawConfig.frequencyDivisor) : undefined
        }
      : undefined;

    const now = new Date();

    await this.mongoService.getDb().collection('sensor_types').updateOne(
      { sensorType },
      {
        $set: {
          sensorType,
          displayName: body.displayName?.toString().trim() || sensorType,
          unit: body.unit?.toString().trim() || null,
          description: body.description?.toString().trim() || null,
          generatorType: generatorType ?? null,
          generatorConfig: generatorConfig ?? null,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );

    return this.mongoService.getDb().collection('sensor_types').findOne({ sensorType }, { projection: { _id: 0 } });
  }

  async getTrainerAssignments(user: RequestUser) {
    this.requireAdmin(user);

    const db = this.mongoService.getDb();
    const [trainers, athletes] = await Promise.all([
      db
        .collection('users')
        .find({ role: 'trainer' }, { projection: { _id: 0, passwordHash: 0 } })
        .sort({ createdAt: -1 })
        .toArray(),
      db.collection('athletes').find({}, { projection: { _id: 0 } }).toArray()
    ]);

    const athletesById = new Map(athletes.map((athlete: any) => [athlete.athleteId, athlete]));

    return trainers.map((trainer: any) => {
      const assignedIds = Array.isArray(trainer.trainerAthleteIds) ? trainer.trainerAthleteIds : [];
      return {
        trainerId: trainer.userId,
        trainerEmail: trainer.email,
        trainerName: trainer.name,
        trainerAthleteIds: assignedIds,
        assignedAthletes: assignedIds
          .map((athleteId: string) => {
            const athlete = athletesById.get(athleteId);
            if (!athlete) return null;
            return {
              athleteId: athlete.athleteId,
              name: `${athlete.firstName} ${athlete.lastName}`,
              sports: athlete.sports ?? [],
              trainingLevel: athlete.trainingLevel ?? null
            };
          })
          .filter(Boolean)
      };
    });
  }

  async updateTrainerAthleteAssignment(trainerId: string, body: any, user: RequestUser) {
    this.requireAdmin(user);

    const athleteId = ensureString(body.athleteId, 'athleteId');
    const action = ensureString(body.action, 'action').toLowerCase();
    if (!['add', 'remove'].includes(action)) {
      throw new BadRequestException('action must be add or remove');
    }

    const db = this.mongoService.getDb();
    const [trainerDoc, athleteDoc] = await Promise.all([
      db.collection('users').findOne({ userId: trainerId, role: 'trainer' }),
      db.collection('athletes').findOne({ athleteId })
    ]);

    if (!trainerDoc) {
      throw new BadRequestException('Trainer not found');
    }
    if (!athleteDoc) {
      throw new BadRequestException('Athlete not found');
    }

    const currentIds = Array.isArray(trainerDoc.trainerAthleteIds) ? trainerDoc.trainerAthleteIds : [];
    const nextIds =
      action === 'add'
        ? Array.from(new Set([...currentIds, athleteId]))
        : currentIds.filter((entry: string) => entry !== athleteId);

    await db.collection('users').updateOne(
      { userId: trainerId, role: 'trainer' },
      {
        $set: {
          trainerAthleteIds: nextIds,
          updatedAt: new Date()
        }
      }
    );

    return {
      updated: true,
      trainerId,
      action,
      athleteId,
      trainerAthleteIds: nextIds
    };
  }
}
