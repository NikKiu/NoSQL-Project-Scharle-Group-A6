# Integration der Aggregation Pipelines in bestehende Services

## Beispiel: Analytics Service erweitern

Hier ein Beispiel, wie die neuen Aggregation Pipelines in den bestehenden `AnalyticsService` integriert werden können:

```typescript
// src/analytics/analytics.service.ts

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

  // Bestehende Methoden bleiben erhalten...
  async averageHeartRate(athleteId: string, query: any, user: RequestUser) {
    // ... existing implementation
  }

  async sessionSummary(sessionId: string, user: RequestUser) {
    // ... existing implementation
  }

  async athleteHistory(athleteId: string, query: any, user: RequestUser) {
    // ... existing implementation
  }

  async calculateLoadZones(athleteId: string, body: any, user: RequestUser) {
    // ... existing implementation
  }

  // NEUE METHODEN mit Aggregation Pipelines

  /**
   * Umfassende Performance-Metriken für einen Sportler
   */
  async getPerformanceMetrics(
    athleteId: string,
    query: any,
    user: RequestUser
  ) {
    await this.athletesService.getById(athleteId, user);

    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');

    if (to <= from) {
      throw new BadRequestException('to must be after from');
    }

    const db = this.mongoService.getDb();
    return AggPipeline.getAthletePerformanceMetrics(db, athleteId, from, to);
  }

  /**
   * Sportartspezifische Statistiken
   */
  async getSportStats(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);

    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');

    const db = this.mongoService.getDb();
    return AggPipeline.getSportStatistics(db, athleteId, from, to);
  }

  /**
   * Fortschritt über Zeit verfolgen
   */
  async getProgress(athleteId: string, query: any, user: RequestUser) {
    await this.athletesService.getById(athleteId, user);

    const sport = query.sport || 'running';
    const metric = query.metric || 'speed';
    const intervalDays = Number(query.intervalDays) || 7;

    if (!['speed', 'heartRate', 'distance'].includes(metric)) {
      throw new BadRequestException('Invalid metric');
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
   * Detaillierte Session-Analyse
   */
  async getDetailedSession(sessionId: string, user: RequestUser) {
    await this.sessionsService.getById(sessionId, user);

    const db = this.mongoService.getDb();
    return AggPipeline.getDetailedSessionAnalysis(db, sessionId);
  }

  /**
   * Herzfrequenz-Zonen Analyse
   */
  async getHeartRateZones(sessionId: string, user: RequestUser) {
    const session = await this.sessionsService.getById(sessionId, user);
    const athlete = await this.athletesService.getById(session.athleteId, user);

    if (!athlete.loadZones) {
      throw new BadRequestException('Athlete has no configured load zones');
    }

    const db = this.mongoService.getDb();
    return AggPipeline.getHeartRateZoneAnalysis(db, sessionId, athlete.loadZones);
  }

  /**
   * Sportler vergleichen
   */
  async compareMultipleAthletes(
    athleteIds: string[],
    query: any,
    user: RequestUser
  ) {
    // Verify access to all athletes
    await Promise.all(
      athleteIds.map(id => this.athletesService.getById(id, user))
    );

    const sport = query.sport;
    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');

    const db = this.mongoService.getDb();
    return AggPipeline.compareAthletes(db, athleteIds, sport, from, to);
  }

  /**
   * Sessions vergleichen
   */
  async compareSessions(sessionIds: string[], user: RequestUser) {
    // Verify access to all sessions
    await Promise.all(
      sessionIds.map(id => this.sessionsService.getById(id, user))
    );

    const db = this.mongoService.getDb();
    return AggPipeline.getSessionComparison(db, sessionIds);
  }

  /**
   * Live-Übersicht (für Trainer)
   */
  async getLiveOverview(athleteIds: string[], user: RequestUser) {
    // Verify access to all athletes
    await Promise.all(
      athleteIds.map(id => this.athletesService.getById(id, user))
    );

    const db = this.mongoService.getDb();
    return AggPipeline.getLiveTrainingOverview(db, athleteIds, 5);
  }

  /**
   * Leaderboard für eine Sportart
   */
  async getLeaderboard(query: any, user: RequestUser) {
    const sport = query.sport || 'running';
    const metric = query.metric || 'speed';
    const limit = Number(query.limit) || 10;
    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');

    if (!['speed', 'heartRate', 'distance'].includes(metric)) {
      throw new BadRequestException('Invalid metric');
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
   * Training-Level-Vergleich
   */
  async compareByTrainingLevel(query: any, user: RequestUser) {
    const sport = query.sport || 'running';
    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');

    const db = this.mongoService.getDb();
    return AggPipeline.compareTrainingLevels(db, sport, from, to);
  }

  /**
   * Sessions mit Notizen finden
   */
  async getNotedSessions(query: any, user: RequestUser) {
    const athleteId = query.athleteId;
    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');

    if (athleteId) {
      await this.athletesService.getById(athleteId, user);
    }

    const db = this.mongoService.getDb();
    return AggPipeline.getSessionsWithNotes(
      db,
      athleteId,
      undefined,
      from,
      to
    );
  }
}
```

## Erweiterte Controller-Endpunkte

```typescript
// src/analytics/analytics.controller.ts

import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { getRequestUser } from '../common/auth/auth.utils';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Bestehende Endpunkte...
  @Get('athletes/:athleteId/average-heart-rate')
  averageHeartRate(@Param('athleteId') athleteId: string, @Query() query: any, @Req() req: any) {
    return this.analyticsService.averageHeartRate(athleteId, query, getRequestUser(req));
  }

  @Get('sessions/:sessionId/summary')
  sessionSummary(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.analyticsService.sessionSummary(sessionId, getRequestUser(req));
  }

  @Get('athletes/:athleteId/history')
  athleteHistory(@Param('athleteId') athleteId: string, @Query() query: any, @Req() req: any) {
    return this.analyticsService.athleteHistory(athleteId, query, getRequestUser(req));
  }

  @Post('athletes/:athleteId/load-zones/calculate')
  calculateLoadZones(@Param('athleteId') athleteId: string, @Body() body: any, @Req() req: any) {
    return this.analyticsService.calculateLoadZones(athleteId, body, getRequestUser(req));
  }

  // NEUE ENDPUNKTE

  /**
   * GET /analytics/athletes/:athleteId/performance-metrics
   * Query: from, to
   */
  @Get('athletes/:athleteId/performance-metrics')
  getPerformanceMetrics(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getPerformanceMetrics(
      athleteId,
      query,
      getRequestUser(req)
    );
  }

  /**
   * GET /analytics/athletes/:athleteId/sport-stats
   * Query: from?, to?
   */
  @Get('athletes/:athleteId/sport-stats')
  getSportStats(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getSportStats(
      athleteId,
      query,
      getRequestUser(req)
    );
  }

  /**
   * GET /analytics/athletes/:athleteId/progress
   * Query: sport, metric (speed|heartRate|distance), intervalDays
   */
  @Get('athletes/:athleteId/progress')
  getProgress(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getProgress(
      athleteId,
      query,
      getRequestUser(req)
    );
  }

  /**
   * GET /analytics/sessions/:sessionId/detailed
   */
  @Get('sessions/:sessionId/detailed')
  getDetailedSession(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.analyticsService.getDetailedSession(
      sessionId,
      getRequestUser(req)
    );
  }

  /**
   * GET /analytics/sessions/:sessionId/hr-zones
   */
  @Get('sessions/:sessionId/hr-zones')
  getHeartRateZones(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.analyticsService.getHeartRateZones(
      sessionId,
      getRequestUser(req)
    );
  }

  /**
   * POST /analytics/compare-athletes
   * Body: { athleteIds: string[], sport?, from?, to? }
   */
  @Post('compare-athletes')
  compareAthletes(@Body() body: any, @Req() req: any) {
    const { athleteIds, ...query } = body;
    return this.analyticsService.compareMultipleAthletes(
      athleteIds,
      query,
      getRequestUser(req)
    );
  }

  /**
   * POST /analytics/compare-sessions
   * Body: { sessionIds: string[] }
   */
  @Post('compare-sessions')
  compareSessions(@Body() body: any, @Req() req: any) {
    return this.analyticsService.compareSessions(
      body.sessionIds,
      getRequestUser(req)
    );
  }

  /**
   * POST /analytics/live-overview
   * Body: { athleteIds: string[] }
   */
  @Post('live-overview')
  getLiveOverview(@Body() body: any, @Req() req: any) {
    return this.analyticsService.getLiveOverview(
      body.athleteIds,
      getRequestUser(req)
    );
  }

  /**
   * GET /analytics/leaderboard
   * Query: sport, metric (speed|heartRate|distance), limit, from?, to?
   */
  @Get('leaderboard')
  getLeaderboard(@Query() query: any, @Req() req: any) {
    return this.analyticsService.getLeaderboard(query, getRequestUser(req));
  }

  /**
   * GET /analytics/compare-training-levels
   * Query: sport, from?, to?
   */
  @Get('compare-training-levels')
  compareByTrainingLevel(@Query() query: any, @Req() req: any) {
    return this.analyticsService.compareByTrainingLevel(
      query,
      getRequestUser(req)
    );
  }

  /**
   * GET /analytics/sessions-with-notes
   * Query: athleteId?, from?, to?
   */
  @Get('sessions-with-notes')
  getNotedSessions(@Query() query: any, @Req() req: any) {
    return this.analyticsService.getNotedSessions(query, getRequestUser(req));
  }
}
```

## Administrator-Endpunkte

```typescript
// src/admin/admin.controller.ts (neu oder erweitert)

import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { getRequestUser } from '../common/auth/auth.utils';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/system-metrics
   * Query: from, to, intervalMinutes?
   */
  @Get('system-metrics')
  getSystemMetrics(@Query() query: any, @Req() req: any) {
    return this.adminService.getSystemMetrics(query, getRequestUser(req));
  }

  /**
   * GET /admin/write-performance
   * Query: from, to, groupByMinutes?
   */
  @Get('write-performance')
  getWritePerformance(@Query() query: any, @Req() req: any) {
    return this.adminService.getWritePerformance(query, getRequestUser(req));
  }

  /**
   * GET /admin/audit-logs
   * Query: from, to, action?
   */
  @Get('audit-logs')
  getAuditLogs(@Query() query: any, @Req() req: any) {
    return this.adminService.getAuditLogs(query, getRequestUser(req));
  }

  /**
   * GET /admin/sensor-types
   * Query: from?, to?
   */
  @Get('sensor-types')
  getSensorTypes(@Query() query: any, @Req() req: any) {
    return this.adminService.getSensorTypeStats(query, getRequestUser(req));
  }

  /**
   * GET /admin/data-volume-by-sport
   * Query: from?, to?
   */
  @Get('data-volume-by-sport')
  getDataVolume(@Query() query: any, @Req() req: any) {
    return this.adminService.getDataVolumePerSport(query, getRequestUser(req));
  }
}
```

```typescript
// src/admin/admin.service.ts

import { Injectable } from '@nestjs/common';
import { MongoService } from '../mongo.service';
import { RequestUser } from '../common/auth/auth.types';
import { parseDate, parseOptionalDate } from '../common/utils/parse';
import * as AggPipeline from '../pipeline/aggregatedData';

@Injectable()
export class AdminService {
  constructor(private readonly mongoService: MongoService) {}

  async getSystemMetrics(query: any, user: RequestUser) {
    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    const intervalMinutes = Number(query.intervalMinutes) || 5;

    const db = this.mongoService.getDb();
    return AggPipeline.getSystemMetrics(db, from, to, intervalMinutes);
  }

  async getWritePerformance(query: any, user: RequestUser) {
    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    const groupByMinutes = Number(query.groupByMinutes) || 1;

    const db = this.mongoService.getDb();
    return AggPipeline.getWritePerformanceMetrics(db, from, to, groupByMinutes);
  }

  async getAuditLogs(query: any, user: RequestUser) {
    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    const action = query.action;

    const db = this.mongoService.getDb();
    return AggPipeline.getAuditLogSummary(db, from, to, action);
  }

  async getSensorTypeStats(query: any, user: RequestUser) {
    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');

    const db = this.mongoService.getDb();
    return AggPipeline.getSensorTypeUsageStats(db, from, to);
  }

  async getDataVolumePerSport(query: any, user: RequestUser) {
    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');

    const db = this.mongoService.getDb();
    return AggPipeline.getDataVolumePerSport(db, from, to);
  }
}
```

## API-Beispiele

### Sportler-APIs

```bash
# Performance-Metriken abrufen
GET /analytics/athletes/athlete123/performance-metrics?from=2026-01-01&to=2026-03-10

# Sportarten-Statistiken
GET /analytics/athletes/athlete123/sport-stats

# Fortschritt verfolgen
GET /analytics/athletes/athlete123/progress?sport=running&metric=speed&intervalDays=7

# Detaillierte Session-Analyse
GET /analytics/sessions/session123/detailed

# Herzfrequenz-Zonen
GET /analytics/sessions/session123/hr-zones
```

### Trainer-APIs

```bash
# Sportler vergleichen
POST /analytics/compare-athletes
{
  "athleteIds": ["athlete1", "athlete2", "athlete3"],
  "sport": "running",
  "from": "2026-01-01",
  "to": "2026-03-10"
}

# Sessions vergleichen
POST /analytics/compare-sessions
{
  "sessionIds": ["session1", "session2", "session3"]
}

# Live-Übersicht
POST /analytics/live-overview
{
  "athleteIds": ["athlete1", "athlete2"]
}

# Leaderboard
GET /analytics/leaderboard?sport=running&metric=speed&limit=10

# Training-Level-Vergleich
GET /analytics/compare-training-levels?sport=running

# Sessions mit Notizen
GET /analytics/sessions-with-notes?athleteId=athlete123
```

### Administrator-APIs

```bash
# System-Metriken
GET /admin/system-metrics?from=2026-03-10T00:00:00Z&to=2026-03-10T23:59:59Z&intervalMinutes=5

# Schreib-Performance
GET /admin/write-performance?from=2026-03-10T00:00:00Z&to=2026-03-10T23:59:59Z&groupByMinutes=1

# Audit-Logs
GET /admin/audit-logs?from=2026-03-01&to=2026-03-10&action=CREATE_SESSION

# Sensortypen-Statistik
GET /admin/sensor-types

# Datenvolumen pro Sportart
GET /admin/data-volume-by-sport
```

