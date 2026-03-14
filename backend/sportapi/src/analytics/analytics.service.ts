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

  // ==================== NEUE PIPELINE-BASIERTE METHODEN ====================

  /**
   * F10, NF4: Umfassende Performance-Metriken für einen Sportler
   * US 6 & 7: Maximalgeschwindigkeit, Trainingshistorie
   * from / to sind optional – ohne Angabe werden alle Events aggregiert.
   */
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

  /**
   * NF4: All-Time Gesamtstatistik – kein Datumsbereich nötig.
   * US 7: Trainingshistorie
   */
  async getAthleteAllTimeStats(athleteId: string, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);
    const db = this.mongoService.getDb();
    return AggPipeline.getAthleteAllTimeStats(db, athleteId);
  }

  /**
   * NF4, NF9: Durchschnittswerte pro Session
   * US 7: Trainingshistorie; US 16: Historische Daten für Trainer
   */
  async getAverageMetricsPerSession(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);
    const limit = Number(query.limit) || 20;
    const sport = query.sport as string | undefined;
    const db    = this.mongoService.getDb();
    return AggPipeline.getAverageMetricsPerSession(db, athleteId, sport, limit);
  }

  /**
   * F10, NF4: Sportartspezifische Statistiken
   * US 5: Unterschiedliche Sportarten verwalten
   */
  async getSportStats(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);

    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');

    const db = this.mongoService.getDb();
    return AggPipeline.getSportStatistics(db, athleteId, from, to);
  }

  /**
   * F10: Fortschritt über Zeit verfolgen
   * US 6 & 7: Leistungsentwicklung verfolgen
   */
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

  /**
   * F10, NF9: Detaillierte Session-Analyse mit allen Metriken
   * US 3, US 7: Sensordaten in Echtzeit und Trainingshistorie
   */
  async getDetailedSession(sessionId: string, user: RequestUser) {
    await this.sessionsService.getById(sessionId, user);

    const db = this.mongoService.getDb();
    return AggPipeline.getDetailedSessionAnalysis(db, sessionId);
  }

  /**
   * F10: Herzfrequenz-Zonen Analyse
   * Zeigt Zeit in verschiedenen Herzfrequenzzonen
   */
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

  /**
   * F10, NF4: Trainingshistorie mit erweiterten Metriken
   * US 7, US 16: Trainingshistorie einsehen
   */
  async getEnhancedHistory(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);

    const limit = Number(query.limit) || 50;

    const db = this.mongoService.getDb();
    return AggPipeline.getTrainingHistory(db, athleteId, limit);
  }

  /**
   * F17, F22: Sportler vergleichen
   * US 13, US 19: Zugriff auf Leistungsdaten, Vergleiche durchführen
   */
  async compareMultipleAthletes(body: any, user: RequestUser) {
    const athleteIds = body.athleteIds;
    if (!Array.isArray(athleteIds) || athleteIds.length === 0) {
      throw new BadRequestException('athleteIds must be a non-empty array');
    }

    // Verify access to all athletes
    await Promise.all(
      athleteIds.map(id => this.athletesService.getById(id, user))
    );

    const sport = body.sport;
    const from = body.from ? parseDate(body.from, 'from') : undefined;
    const to = body.to ? parseDate(body.to, 'to') : undefined;

    const db = this.mongoService.getDb();
    return AggPipeline.compareAthletes(db, athleteIds, sport, from, to);
  }

  /**
   * F10, F17: Sessions vergleichen
   * US 17: Leistungswerte über mehrere Trainingseinheiten vergleichen
   */
  async compareSessions(body: any, user: RequestUser) {
    const sessionIds = body.sessionIds;
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      throw new BadRequestException('sessionIds must be a non-empty array');
    }

    // Verify access to all sessions
    await Promise.all(
      sessionIds.map(id => this.sessionsService.getById(id, user))
    );

    const db = this.mongoService.getDb();
    return AggPipeline.getSessionComparison(db, sessionIds);
  }

  /**
   * F17, NF2: Live-Übersicht mehrerer Sportler
   * US 14: Echtzeitdaten während des Trainings
   */
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

  /**
   * F10: Leaderboard für eine Sportart
   * US 19: Vergleiche zwischen Sportlern durchführen
   */
  async getLeaderboard(query: any) {
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

  /**
   * F10: Training-Level-Vergleich
   * US 19: Vergleiche zwischen Sportlern durchführen
   */
  async compareByTrainingLevel(query: any) {
    const sport = query.sport || 'running';
    const from = query.from ? parseDate(query.from, 'from') : undefined;
    const to = query.to ? parseDate(query.to, 'to') : undefined;

    const db = this.mongoService.getDb();
    return AggPipeline.compareTrainingLevels(db, sport, from, to);
  }

  /**
   * F21: Sessions mit Notizen finden
   * US 15: Notizen speichern und durchsuchen
   */
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
