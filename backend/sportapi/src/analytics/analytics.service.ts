import { BadRequestException, Injectable } from '@nestjs/common';
import { MongoService } from '../mongo.service';
import { AthletesService } from '../athletes/athletes.service';
import { SessionsService } from '../sessions/sessions.service';
import { RequestUser } from '../common/auth/auth.types';
import { parseDate, parseOptionalDate } from '../common/utils/parse';
import * as AggPipeline from '../pipeline/aggregatedData';

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
      z5: { min: Math.round(maxHeartRate * 0.9), max: Math.round(maxHeartRate) }
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

  async getPerformanceMetrics(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);

    const from = parseOptionalDate(query.from, 'from');
    const to   = parseOptionalDate(query.to,   'to');

    if (from && to && to <= from) {
      throw new BadRequestException('to must be after from');
    }

    const db = this.mongoService.getDb();
    return AggPipeline.getAthletePerformanceMetrics(db, athleteId, from, to);
  }

  async getAthleteAllTimeStats(athleteId: string, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);
    const db = this.mongoService.getDb();
    return AggPipeline.getAthleteAllTimeStats(db, athleteId);
  }

  async getAverageMetricsPerSession(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);
    const limit = Number(query.limit) || 20;
    const sport = query.sport as string | undefined;
    const db    = this.mongoService.getDb();
    return AggPipeline.getAverageMetricsPerSession(db, athleteId, sport, limit);
  }

  async getSportStats(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);

    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');

    const db = this.mongoService.getDb();
    return AggPipeline.getSportStatistics(db, athleteId, from, to);
  }

  async getProgress(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);

    const sport = query.sport || 'running';
    const metric = query.metric || 'speed';
    const intervalDays = Number(query.intervalDays) || 7;

    if (!['speed', 'heartRate', 'distance'].includes(metric)) {
      throw new BadRequestException('Invalid metric. Must be: speed, heartRate, or distance');
    }

    const db = this.mongoService.getDb();
    return AggPipeline.getProgressOverTime(
      db,
      athleteId,
      sport,
      metric as any,
      intervalDays
    );
  }

  async getDetailedSession(sessionId: string, user: RequestUser) {
    await this.sessionsService.getById(sessionId, user);

    const db = this.mongoService.getDb();
    return AggPipeline.getDetailedSessionAnalysis(db, sessionId);
  }

  async getHeartRateZones(sessionId: string, user: RequestUser) {
    const session = await this.sessionsService.getById(sessionId, user);
    const athlete = await this.athletesService.getById(session.athleteId, user);

    if (!athlete.loadZones || !athlete.loadZones.z1 || !athlete.loadZones.z2 ||
        !athlete.loadZones.z3 || !athlete.loadZones.z4 || !athlete.loadZones.z5) {
      throw new BadRequestException('Athlete has no configured load zones. Please calculate load zones first.');
    }

    const zones = {
      z1: athlete.loadZones.z1,
      z2: athlete.loadZones.z2,
      z3: athlete.loadZones.z3,
      z4: athlete.loadZones.z4,
      z5: athlete.loadZones.z5
    };

    const db = this.mongoService.getDb();
    return AggPipeline.getHeartRateZoneAnalysis(db, sessionId, zones);
  }

  async getEnhancedHistory(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);

    const limit = Number(query.limit) || 50;

    const db = this.mongoService.getDb();
    return AggPipeline.getTrainingHistory(db, athleteId, limit);
  }

  async compareMultipleAthletes(body: any, user: RequestUser) {
    const athleteIds = body.athleteIds;
    if (!Array.isArray(athleteIds) || athleteIds.length === 0) {
      throw new BadRequestException('athleteIds must be a non-empty array');
    }

    // Verify access to all athletes
    await Promise.all(
      athleteIds.map(id => this.athletesService.getById(id, user))
    );

    const sport = typeof body.sport === 'string' ? body.sport.trim() : '';
    if (!sport) {
      throw new BadRequestException('sport is required for athlete comparison');
    }
    const from = body.from ? parseDate(body.from, 'from') : undefined;
    const to = body.to ? parseDate(body.to, 'to') : undefined;

    const db = this.mongoService.getDb();
    return AggPipeline.compareAthletes(db, athleteIds, sport, from, to);
  }

  async compareSessions(body: any, user: RequestUser) {
    const sessionIds = body.sessionIds;
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      throw new BadRequestException('sessionIds must be a non-empty array');
    }

    // Verify access and collect sessions for sport consistency check.
    const sessions = await Promise.all(
      sessionIds.map(id => this.sessionsService.getById(id, user))
    );

    const sports = Array.from(
      new Set(
        sessions
          .map(session => String(session.sport ?? '').trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (sports.length !== 1) {
      throw new BadRequestException(
        `Session comparison is only allowed for the same sport. Found: ${sports.join(', ') || 'unknown'}`
      );
    }

    const db = this.mongoService.getDb();
    return AggPipeline.getSessionComparison(db, sessionIds);
  }

  async getLiveOverview(body: any, user: RequestUser) {
    const athleteIds = body.athleteIds;
    if (!Array.isArray(athleteIds) || athleteIds.length === 0) {
      throw new BadRequestException('athleteIds must be a non-empty array');
    }

    // Verify access to all athletes
    await Promise.all(
      athleteIds.map(id => this.athletesService.getById(id, user))
    );

    const lastMinutes = Number(body.lastMinutes) || 5;

    const db = this.mongoService.getDb();
    return AggPipeline.getLiveTrainingOverview(db, athleteIds, lastMinutes);
  }

  async getLeaderboard(query: any, user: RequestUser) {
    const sport = query.sport || 'running';
    const metric = query.metric || 'speed';
    const limit = Number(query.limit) || 10;
    const from = query.from ? parseDate(query.from, 'from') : undefined;
    const to = query.to ? parseDate(query.to, 'to') : undefined;

    if (!['speed', 'heartRate', 'distance'].includes(metric)) {
      throw new BadRequestException('Invalid metric. Must be: speed, heartRate, or distance');
    }

    const db = this.mongoService.getDb();
    return AggPipeline.getSportLeaderboard(
      db,
      sport,
      metric as any,
      from,
      to,
      limit
    );
  }

  async compareByTrainingLevel(query: any, user: RequestUser) {
    const sport = query.sport || 'running';
    const from = query.from ? parseDate(query.from, 'from') : undefined;
    const to = query.to ? parseDate(query.to, 'to') : undefined;

    const db = this.mongoService.getDb();
    return AggPipeline.compareTrainingLevels(db, sport, from, to);
  }

  async getNotedSessions(query: any, user: RequestUser) {
    const athleteId = query.athleteId;
    const from = query.from ? parseDate(query.from, 'from') : undefined;
    const to = query.to ? parseDate(query.to, 'to') : undefined;

    if (athleteId) {
      await this.athletesService.getById(athleteId, user);
    }

    const db = this.mongoService.getDb();
    return AggPipeline.getSessionsWithNotes(
      db,
      athleteId,
      from,
      to
    );
  }
}
