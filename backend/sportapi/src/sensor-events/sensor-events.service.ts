import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { MongoService } from '../mongo.service';
import { SessionsService } from '../sessions/sessions.service';
import { AthletesService } from '../athletes/athletes.service';
import { RequestUser } from '../common/auth/auth.types';
import { createId } from '../common/utils/id';
import { ensureString, parseDate, parseLimit, parseOptionalNumber } from '../common/utils/parse';
import { SensorEventDocument } from './sensor-events.types';

@Injectable()
export class SensorEventsService {
  constructor(
    private readonly mongoService: MongoService,
    private readonly sessionsService: SessionsService,
    private readonly athletesService: AthletesService
  ) {}

  private collection() {
    return this.mongoService.getDb().collection<SensorEventDocument>('sensor_events');
  }

  private async normalizeEvent(body: any, user: RequestUser): Promise<SensorEventDocument> {
    const sessionId = ensureString(body.sessionId, 'sessionId');
    const session = await this.sessionsService.getById(sessionId, user);
    const athlete = await this.athletesService.getById(session.athleteId, user);

    if (user.role === 'athlete' && athlete.userId !== user.userId) {
      throw new ForbiddenException('Athletes can only write their own sensor data');
    }

    const timestamp = parseDate(body.timestamp, 'timestamp');
    const sensorType = ensureString(body.sensorType, 'sensorType');
    const metrics = body.metrics && typeof body.metrics === 'object' ? body.metrics : {};

    const heartRate = parseOptionalNumber(body.heartRate ?? metrics.heartRate, 'heartRate');
    const speed = parseOptionalNumber(body.speed ?? metrics.speed, 'speed');
    const distanceDelta = parseOptionalNumber(body.distanceDelta ?? metrics.distanceDelta, 'distanceDelta');

    return {
      eventId: body.eventId?.toString().trim() || createId('event'),
      athleteId: session.athleteId,
      sessionId,
      timestamp,
      sensorType,
      metrics,
      heartRate,
      speed,
      distanceDelta,
      createdAt: new Date()
    };
  }

  async create(body: any, user: RequestUser) {
    const event = await this.normalizeEvent(body, user);
    try {
      await this.collection().insertOne(event as any);
      return event;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new BadRequestException('eventId already exists');
      }
      throw error;
    }
  }

  async createBatch(body: any, user: RequestUser) {
    if (!Array.isArray(body.events) || body.events.length === 0) {
      throw new BadRequestException('events must be a non-empty array');
    }

    if (body.events.length > 5000) {
      throw new BadRequestException('Max 5000 events per request');
    }

    const events = await Promise.all(body.events.map((event: any) => this.normalizeEvent(event, user)));
    await this.collection().insertMany(events as any[], { ordered: false });

    return {
      insertedCount: events.length,
      firstEventAt: events[0]?.timestamp,
      lastEventAt: events[events.length - 1]?.timestamp
    };
  }

  async recentForAthlete(athleteId: string, user: RequestUser, query: any) {
    await this.athletesService.getById(athleteId, user);

    const seconds = Number(query.seconds || 600);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new BadRequestException('seconds must be a positive number');
    }

    const since = new Date(Date.now() - seconds * 1000);
    const limit = parseLimit(query.limit, 500, 5000);

    return this.collection()
      .find({ athleteId, timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }
}
