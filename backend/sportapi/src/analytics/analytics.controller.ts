import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { getRequestUser } from '../common/auth/auth.utils';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ==================== BESTEHENDE ENDPUNKTE ====================

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

  // ==================== NEUE PIPELINE-BASIERTE ENDPUNKTE ====================

  /**
   * GET /analytics/athletes/:athleteId/performance-metrics
   * Query: from?, to? (ISO-Datum, beide optional)
   * Anforderungen: F10, NF4, US 6 & 7
   * Beispiel: GET /api/analytics/athletes/athlete-1/performance-metrics
   *           GET /api/analytics/athletes/athlete-1/performance-metrics?from=2026-01-01&to=2026-03-14
   */
  @Get('athletes/:athleteId/performance-metrics')
  getPerformanceMetrics(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getPerformanceMetrics(athleteId, query, getRequestUser(req));
  }

  /**
   * GET /analytics/athletes/:athleteId/all-time-stats
   * Kein Datumsbereich nötig – aggregiert ALLE vorhandenen Sensordaten.
   * Anforderungen: NF4, US 7
   * Beispiel: GET /api/analytics/athletes/athlete-1/all-time-stats
   */
  @Get('athletes/:athleteId/all-time-stats')
  getAthleteAllTimeStats(@Param('athleteId') athleteId: string, @Req() req: any) {
    return this.analyticsService.getAthleteAllTimeStats(athleteId, getRequestUser(req));
  }

  /**
   * GET /analytics/athletes/:athleteId/avg-per-session
   * Query: limit? (default 20), sport? (z.B. running/cycling/swimming)
   * Durchschnittswerte (Herzfrequenz, Speed, Distanz) je Trainingseinheit.
   * Anforderungen: NF4, NF9, US 7, US 16
   * Beispiel: GET /api/analytics/athletes/athlete-1/avg-per-session
   *           GET /api/analytics/athletes/athlete-1/avg-per-session?sport=running&limit=10
   */
  @Get('athletes/:athleteId/avg-per-session')
  getAverageMetricsPerSession(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getAverageMetricsPerSession(athleteId, query, getRequestUser(req));
  }

  /**
   * GET /analytics/athletes/:athleteId/sport-stats
   * Query: from?, to? (ISO dates)
   * Anforderungen: F10, NF4, US 5
   */
  @Get('athletes/:athleteId/sport-stats')
  getSportStats(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getSportStats(athleteId, query, getRequestUser(req));
  }

  /**
   * GET /analytics/athletes/:athleteId/progress
   * Query: sport, metric (speed|heartRate|distance), intervalDays
   * Anforderungen: F10, US 6 & 7
   */
  @Get('athletes/:athleteId/progress')
  getProgress(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getProgress(athleteId, query, getRequestUser(req));
  }

  /**
   * GET /analytics/athletes/:athleteId/history-enhanced
   * Query: limit?
   * Anforderungen: F10, NF4, US 7, US 16
   */
  @Get('athletes/:athleteId/history-enhanced')
  getEnhancedHistory(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getEnhancedHistory(athleteId, query, getRequestUser(req));
  }

  /**
   * GET /analytics/sessions/:sessionId/detailed
   * Anforderungen: F10, NF9, US 3, US 7
   */
  @Get('sessions/:sessionId/detailed')
  getDetailedSession(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.analyticsService.getDetailedSession(sessionId, getRequestUser(req));
  }

  /**
   * GET /analytics/sessions/:sessionId/hr-zones
   * Anforderungen: F10
   */
  @Get('sessions/:sessionId/hr-zones')
  getHeartRateZones(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.analyticsService.getHeartRateZones(sessionId, getRequestUser(req));
  }

  /**
   * POST /analytics/compare-athletes
   * Body: { athleteIds: string[], sport?, from?, to? }
   * Anforderungen: F17, F22, NF10, US 13, US 19
   */
  @Post('compare-athletes')
  compareAthletes(@Body() body: any, @Req() req: any) {
    return this.analyticsService.compareMultipleAthletes(body, getRequestUser(req));
  }

  /**
   * POST /analytics/compare-sessions
   * Body: { sessionIds: string[] }
   * Anforderungen: F10, F17, US 17
   */
  @Post('compare-sessions')
  compareSessions(@Body() body: any, @Req() req: any) {
    return this.analyticsService.compareSessions(body, getRequestUser(req));
  }

  /**
   * POST /analytics/live-overview
   * Body: { athleteIds: string[], lastMinutes?: number }
   * Anforderungen: F17, NF10, NF2, US 14
   */
  @Post('live-overview')
  getLiveOverview(@Body() body: any, @Req() req: any) {
    return this.analyticsService.getLiveOverview(body, getRequestUser(req));
  }

  /**
   * GET /analytics/leaderboard
   * Query: sport, metric (speed|heartRate|distance), limit?, from?, to?
   * Anforderungen: F10, NF10, US 19
   */
  @Get('leaderboard')
  getLeaderboard(@Query() query: any, @Req() req: any) {
    return this.analyticsService.getLeaderboard(query, getRequestUser(req));
  }

  /**
   * GET /analytics/compare-training-levels
   * Query: sport, from?, to?
   * Anforderungen: F10, US 19
   */
  @Get('compare-training-levels')
  compareByTrainingLevel(@Query() query: any, @Req() req: any) {
    return this.analyticsService.compareByTrainingLevel(query, getRequestUser(req));
  }

  /**
   * GET /analytics/sessions-with-notes
   * Query: athleteId?, from?, to?
   * Anforderungen: F21, US 15
   */
  @Get('sessions-with-notes')
  getNotedSessions(@Query() query: any, @Req() req: any) {
    return this.analyticsService.getNotedSessions(query, getRequestUser(req));
  }
}
