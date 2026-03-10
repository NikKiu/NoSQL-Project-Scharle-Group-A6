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
}
