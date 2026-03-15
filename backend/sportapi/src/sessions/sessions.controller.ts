import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { getRequestUser } from '../common/auth/auth.utils';

@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('sessions')
  create(@Body() body: any, @Req() req: any) {
    return this.sessionsService.create(body, getRequestUser(req));
  }

  @Get('sessions/:sessionId')
  getById(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.sessionsService.getById(sessionId, getRequestUser(req));
  }

  @Get('athletes/:athleteId/sessions')
  listForAthlete(@Param('athleteId') athleteId: string, @Req() req: any, @Query() query: any) {
    return this.sessionsService.listForAthlete(athleteId, getRequestUser(req), query);
  }

  @Patch('sessions/:sessionId/finish')
  finish(@Param('sessionId') sessionId: string, @Body() body: any, @Req() req: any) {
    return this.sessionsService.finish(sessionId, body, getRequestUser(req));
  }

  @Patch('sessions/:sessionId/notes')
  updateNotes(@Param('sessionId') sessionId: string, @Body() body: any, @Req() req: any) {
    return this.sessionsService.updateNotes(sessionId, body, getRequestUser(req));
  }
}
