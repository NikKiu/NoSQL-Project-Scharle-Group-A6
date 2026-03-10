import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MongoService } from '../mongo.service';
import { AthletesService } from '../athletes/athletes.service';
import { RequestUser } from '../common/auth/auth.types';
import { createId } from '../common/utils/id';
import { ensureString, ensureStringArray, parseDate, parseLimit } from '../common/utils/parse';
import { TrainingSessionDocument } from './sessions.types';

@Injectable()
export class SessionsService {
  constructor(
    private readonly mongoService: MongoService,
    private readonly athletesService: AthletesService
  ) {}

  private collection() {
    return this.mongoService.getDb().collection<TrainingSessionDocument>('training_sessions');
  }

  async create(body: any, user: RequestUser) {
    const athleteId = ensureString(body.athleteId, 'athleteId');
    const athlete = await this.athletesService.getById(athleteId, user);

    if (user.role === 'athlete' && athlete.userId !== user.userId) {
      throw new ForbiddenException('Athletes can only create sessions for themselves');
    }

    const now = new Date();
    const session: TrainingSessionDocument = {
      sessionId: body.sessionId?.toString().trim() || createId('session'),
      athleteId,
      sport: ensureString(body.sport, 'sport'),
      status: 'active',
      sensorTypes: ensureStringArray(body.sensorTypes ?? ['unspecified'], 'sensorTypes'),
      startAt: body.startAt ? parseDate(body.startAt, 'startAt') : now,
      notes: body.notes?.toString(),
      createdAt: now,
      updatedAt: now
    };

    try {
      await this.collection().insertOne(session as any);
      return session;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new BadRequestException('sessionId already exists');
      }
      throw error;
    }
  }

  async getById(sessionId: string, user: RequestUser) {
    const session = await this.collection().findOne({ sessionId });
    if (!session) throw new NotFoundException('Session not found');

    await this.athletesService.getById(session.athleteId, user);
    return session;
  }

  async listForAthlete(athleteId: string, user: RequestUser, query: any) {
    await this.athletesService.getById(athleteId, user);

    const filter: any = { athleteId };
    if (query.status) filter.status = query.status;

    const limit = parseLimit(query.limit, 50, 1000);
    return this.collection().find(filter).sort({ startAt: -1 }).limit(limit).toArray();
  }

  async finish(sessionId: string, body: any, user: RequestUser) {
    const session = await this.getById(sessionId, user);
    if (session.status === 'finished') {
      throw new BadRequestException('Session is already finished');
    }

    const endAt = body.endAt ? parseDate(body.endAt, 'endAt') : new Date();
    if (endAt < new Date(session.startAt)) {
      throw new BadRequestException('endAt must be after startAt');
    }

    await this.collection().updateOne(
      { sessionId },
      {
        $set: {
          status: 'finished',
          endAt,
          updatedAt: new Date()
        }
      }
    );

    return this.collection().findOne({ sessionId });
  }
}
