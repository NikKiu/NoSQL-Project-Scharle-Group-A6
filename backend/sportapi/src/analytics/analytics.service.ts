import { BadRequestException, Injectable } from '@nestjs/common';
import { MongoService } from '../mongo.service';
import { AthletesService } from '../athletes/athletes.service';
import { SessionsService } from '../sessions/sessions.service';
import { RequestUser } from '../common/auth/auth.types';
import { parseDate, parseOptionalDate } from '../common/utils/parse';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly mongoService: MongoService,
    private readonly athletesService: AthletesService,
    private readonly sessionsService: SessionsService
  ) {}

  async averageHeartRate(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);

    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    if (to <= from) {
      throw new BadRequestException('to must be after from');
    }

    const [result] = await this.mongoService
      .getDb()
      .collection('sensor_events')
      .aggregate([
        {
          $match: {
            athleteId,
            timestamp: { $gte: from, $lte: to },
            heartRate: { $type: 'number' }
          }
        },
        {
          $group: {
            _id: null,
            avgHeartRate: { $avg: '$heartRate' },
            minHeartRate: { $min: '$heartRate' },
            maxHeartRate: { $max: '$heartRate' },
            sampleCount: { $sum: 1 }
          }
        }
      ])
      .toArray();

    return {
      athleteId,
      from,
      to,
      avgHeartRate: result?.avgHeartRate ?? null,
      minHeartRate: result?.minHeartRate ?? null,
      maxHeartRate: result?.maxHeartRate ?? null,
      sampleCount: result?.sampleCount ?? 0
    };
  }

  async sessionSummary(sessionId: string, user: RequestUser) {
    const session = await this.sessionsService.getById(sessionId, user);

    const [result] = await this.mongoService
      .getDb()
      .collection('sensor_events')
      .aggregate([
        { $match: { sessionId } },
        {
          $group: {
            _id: '$sessionId',
            avgHeartRate: { $avg: '$heartRate' },
            maxHeartRate: { $max: '$heartRate' },
            maxSpeed: { $max: '$speed' },
            totalDistance: { $sum: { $ifNull: ['$distanceDelta', 0] } },
            eventCount: { $sum: 1 },
            firstEventAt: { $min: '$timestamp' },
            lastEventAt: { $max: '$timestamp' }
          }
        }
      ])
      .toArray();

    return {
      sessionId,
      athleteId: session.athleteId,
      sport: session.sport,
      status: session.status,
      startAt: session.startAt,
      endAt: session.endAt ?? null,
      avgHeartRate: result?.avgHeartRate ?? null,
      maxHeartRate: result?.maxHeartRate ?? null,
      maxSpeed: result?.maxSpeed ?? null,
      totalDistance: result?.totalDistance ?? 0,
      eventCount: result?.eventCount ?? 0,
      firstEventAt: result?.firstEventAt ?? null,
      lastEventAt: result?.lastEventAt ?? null
    };
  }

  async athleteHistory(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);

    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');

    const sessionFilter: any = { athleteId };
    if (from || to) {
      sessionFilter.startAt = {};
      if (from) sessionFilter.startAt.$gte = from;
      if (to) sessionFilter.startAt.$lte = to;
    }

    const sessions = await this.mongoService
      .getDb()
      .collection('training_sessions')
      .find(sessionFilter)
      .sort({ startAt: -1 })
      .limit(200)
      .toArray();

    const summaries = await Promise.all(
      sessions.map((session) => this.sessionSummary(session.sessionId, user))
    );

    return {
      athleteId,
      from: from ?? null,
      to: to ?? null,
      sessions: summaries
    };
  }

  async calculateLoadZones(athleteId: string, body: any, user: RequestUser) {
    const athlete = await this.athletesService.getById(athleteId, user);

    const maxHeartRate = Number(body.maxHeartRate);
    if (!Number.isFinite(maxHeartRate) || maxHeartRate <= 0) {
      throw new BadRequestException('maxHeartRate must be a positive number');
    }

    const zones = {
      z1: { min: Math.round(maxHeartRate * 0.5), max: Math.round(maxHeartRate * 0.6) },
      z2: { min: Math.round(maxHeartRate * 0.6), max: Math.round(maxHeartRate * 0.7) },
      z3: { min: Math.round(maxHeartRate * 0.7), max: Math.round(maxHeartRate * 0.8) },
      z4: { min: Math.round(maxHeartRate * 0.8), max: Math.round(maxHeartRate * 0.9) },
      z5: { min: Math.round(maxHeartRate * 0.9), max: Math.round(maxHeartRate * 1.0) }
    };

    if (body.persist === true) {
      await this.mongoService.getDb().collection('athletes').updateOne(
        { athleteId: athlete.athleteId },
        { $set: { loadZones: zones, updatedAt: new Date() } }
      );
    }

    return {
      athleteId,
      maxHeartRate,
      zones,
      persisted: body.persist === true
    };
  }
}
