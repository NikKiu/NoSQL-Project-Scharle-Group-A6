import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { getRequestUser } from '../common/auth/auth.utils';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

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

  @Get('athletes/:athleteId/performance-metrics')
  getPerformanceMetrics(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getPerformanceMetrics(athleteId, query, getRequestUser(req));
  }

  @Get('athletes/:athleteId/all-time-stats')
  getAthleteAllTimeStats(@Param('athleteId') athleteId: string, @Req() req: any) {
    return this.analyticsService.getAthleteAllTimeStats(athleteId, getRequestUser(req));
  }
  @Get('athletes/:athleteId/avg-per-session')
  getAverageMetricsPerSession(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getAverageMetricsPerSession(athleteId, query, getRequestUser(req));
  }

  @Get('athletes/:athleteId/sport-stats')
  getSportStats(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getSportStats(athleteId, query, getRequestUser(req));
  }

  @Get('athletes/:athleteId/progress')
  getProgress(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getProgress(athleteId, query, getRequestUser(req));
  }

  @Get('athletes/:athleteId/history-enhanced')
  getEnhancedHistory(
    @Param('athleteId') athleteId: string,
    @Query() query: any,
    @Req() req: any
  ) {
    return this.analyticsService.getEnhancedHistory(athleteId, query, getRequestUser(req));
  }

  @Get('sessions/:sessionId/detailed')
  getDetailedSession(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.analyticsService.getDetailedSession(sessionId, getRequestUser(req));
  }

  @Get('sessions/:sessionId/hr-zones')
  getHeartRateZones(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.analyticsService.getHeartRateZones(sessionId, getRequestUser(req));
  }

  @Post('compare-athletes')
  compareAthletes(@Body() body: any, @Req() req: any) {
    return this.analyticsService.compareMultipleAthletes(body, getRequestUser(req));
  }

  @Post('compare-sessions')
  compareSessions(@Body() body: any, @Req() req: any) {
    return this.analyticsService.compareSessions(body, getRequestUser(req));
  }

  @Post('live-overview')
  getLiveOverview(@Body() body: any, @Req() req: any) {
    return this.analyticsService.getLiveOverview(body, getRequestUser(req));
  }

  @Get('leaderboard')
  getLeaderboard(@Query() query: any, @Req() req: any) {
    return this.analyticsService.getLeaderboard(query, getRequestUser(req));
  }

  @Get('compare-training-levels')
  compareByTrainingLevel(@Query() query: any, @Req() req: any) {
    return this.analyticsService.compareByTrainingLevel(query, getRequestUser(req));
  }

  @Get('sessions-with-notes')
  getNotedSessions(@Query() query: any, @Req() req: any) {
    return this.analyticsService.getNotedSessions(query, getRequestUser(req));
  }
}
