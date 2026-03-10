import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MongoService } from '../mongo.service';
import { RequestUser } from '../common/auth/auth.types';
import { canDeleteAthletes, canManageAthletes } from '../common/auth/auth.utils';
import { createId } from '../common/utils/id';
import { ensureString, ensureStringArray, parseDate, parseOptionalNumber } from '../common/utils/parse';
import { AthleteDocument } from './athletes.types';

@Injectable()
export class AthletesService {
  constructor(private readonly mongoService: MongoService) {}

  private collection() {
    return this.mongoService.getDb().collection<AthleteDocument>('athletes');
  }

  private async resolveAthleteForUser(athleteId: string, user: RequestUser): Promise<AthleteDocument> {
    const athlete = await this.collection().findOne({ athleteId });
    if (!athlete) throw new NotFoundException('Athlete not found');

    if (user.role === 'athlete' && athlete.userId !== user.userId) {
      throw new ForbiddenException('Athletes can only access their own profile');
    }

    return athlete;
  }

  async create(body: any, user: RequestUser) {
    if (!canManageAthletes(user.role) && user.role !== 'athlete') {
      throw new ForbiddenException('Not allowed to create athlete profile');
    }

    const now = new Date();
    const athleteId = body.athleteId?.toString().trim() || createId('athlete');
    const userId = ensureString(body.userId || user.userId, 'userId');

    if (user.role === 'athlete' && userId !== user.userId) {
      throw new ForbiddenException('Athletes can only create their own profile');
    }

    const athlete: AthleteDocument = {
      athleteId,
      userId,
      firstName: ensureString(body.firstName, 'firstName'),
      lastName: ensureString(body.lastName, 'lastName'),
      birthDate: parseDate(body.birthDate, 'birthDate'),
      gender: ensureString(body.gender, 'gender'),
      weightKg: parseOptionalNumber(body.weightKg, 'weightKg'),
      heightCm: parseOptionalNumber(body.heightCm, 'heightCm'),
      trainingLevel: ensureString(body.trainingLevel, 'trainingLevel'),
      sports: ensureStringArray(body.sports ?? ['unspecified'], 'sports'),
      loadZones: body.loadZones,
      createdAt: now,
      updatedAt: now
    };

    try {
      await this.collection().insertOne(athlete as any);
      return athlete;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new BadRequestException('athleteId or userId already exists');
      }
      throw error;
    }
  }

  async list(user: RequestUser, query: any) {
    if (user.role === 'athlete') {
      const ownAthlete = await this.collection().findOne({ userId: user.userId });
      return ownAthlete ? [ownAthlete] : [];
    }

    const filter: any = {};
    if (query.userId) filter.userId = query.userId;
    if (query.trainingLevel) filter.trainingLevel = query.trainingLevel;

    return this.collection().find(filter).sort({ createdAt: -1 }).toArray();
  }

  async getById(athleteId: string, user: RequestUser) {
    return this.resolveAthleteForUser(athleteId, user);
  }

  async update(athleteId: string, body: any, user: RequestUser) {
    const existing = await this.resolveAthleteForUser(athleteId, user);

    if (user.role === 'athlete' && body.userId && body.userId !== existing.userId) {
      throw new ForbiddenException('Athletes cannot reassign profile ownership');
    }

    const updateDoc: any = {
      updatedAt: new Date()
    };

    if (body.firstName !== undefined) updateDoc.firstName = ensureString(body.firstName, 'firstName');
    if (body.lastName !== undefined) updateDoc.lastName = ensureString(body.lastName, 'lastName');
    if (body.birthDate !== undefined) updateDoc.birthDate = parseDate(body.birthDate, 'birthDate');
    if (body.gender !== undefined) updateDoc.gender = ensureString(body.gender, 'gender');
    if (body.weightKg !== undefined) updateDoc.weightKg = parseOptionalNumber(body.weightKg, 'weightKg');
    if (body.heightCm !== undefined) updateDoc.heightCm = parseOptionalNumber(body.heightCm, 'heightCm');
    if (body.trainingLevel !== undefined) updateDoc.trainingLevel = ensureString(body.trainingLevel, 'trainingLevel');
    if (body.sports !== undefined) updateDoc.sports = ensureStringArray(body.sports, 'sports');
    if (body.loadZones !== undefined) updateDoc.loadZones = body.loadZones;

    if (body.userId !== undefined) {
      if (!canManageAthletes(user.role)) {
        throw new ForbiddenException('Only trainer or admin can update userId');
      }
      updateDoc.userId = ensureString(body.userId, 'userId');
    }

    await this.collection().updateOne({ athleteId }, { $set: updateDoc });
    return this.collection().findOne({ athleteId });
  }

  async delete(athleteId: string, user: RequestUser) {
    if (!canDeleteAthletes(user.role)) {
      throw new ForbiddenException('Only trainer or admin can delete athletes');
    }

    const existing = await this.collection().findOne({ athleteId });
    if (!existing) throw new NotFoundException('Athlete not found');

    await Promise.all([
      this.collection().deleteOne({ athleteId }),
      this.mongoService.getDb().collection('training_sessions').deleteMany({ athleteId }),
      this.mongoService.getDb().collection('sensor_events').deleteMany({ athleteId })
    ]);

    return { deleted: true, athleteId };
  }

  async getByUserId(userId: string) {
    return this.collection().findOne({ userId });
  }
}
