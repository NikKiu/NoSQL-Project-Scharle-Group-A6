import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { AthletesService } from './athletes.service';
import { getRequestUser } from '../common/auth/auth.utils';

@Controller('athletes')
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.athletesService.create(body, getRequestUser(req));
  }

  @Get()
  list(@Req() req: any, @Query() query: any) {
    return this.athletesService.list(getRequestUser(req), query);
  }

  @Get(':athleteId')
  getById(@Param('athleteId') athleteId: string, @Req() req: any) {
    return this.athletesService.getById(athleteId, getRequestUser(req));
  }

  @Patch(':athleteId')
  update(@Param('athleteId') athleteId: string, @Body() body: any, @Req() req: any) {
    return this.athletesService.update(athleteId, body, getRequestUser(req));
  }

  @Delete(':athleteId')
  delete(@Param('athleteId') athleteId: string, @Req() req: any) {
    return this.athletesService.delete(athleteId, getRequestUser(req));
  }
}
