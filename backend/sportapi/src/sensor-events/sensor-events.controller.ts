import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { SensorEventsService } from './sensor-events.service';
import { getRequestUser } from '../common/auth/auth.utils';

@Controller()
export class SensorEventsController {
  constructor(private readonly sensorEventsService: SensorEventsService) {}

  @Post('sensor-events')
  create(@Body() body: any, @Req() req: any) {
    return this.sensorEventsService.create(body, getRequestUser(req));
  }

  @Post('sensor-events/batch')
  createBatch(@Body() body: any, @Req() req: any) {
    return this.sensorEventsService.createBatch(body, getRequestUser(req));
  }

  @Get('athletes/:athleteId/sensor-events/recent')
  recentForAthlete(@Param('athleteId') athleteId: string, @Req() req: any, @Query() query: any) {
    return this.sensorEventsService.recentForAthlete(athleteId, getRequestUser(req), query);
  }
}
