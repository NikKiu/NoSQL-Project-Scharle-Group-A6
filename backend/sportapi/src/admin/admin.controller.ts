import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { getRequestUser } from '../common/auth/auth.utils';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('system-metrics')
  getSystemMetrics(@Query() query: any, @Req() req: any) {
    return this.adminService.getSystemMetrics(query, getRequestUser(req));
  }

  @Get('write-performance')
  getWritePerformance(@Query() query: any, @Req() req: any) {
    return this.adminService.getWritePerformance(query, getRequestUser(req));
  }

  @Get('audit-logs')
  getAuditLogs(@Query() query: any, @Req() req: any) {
    return this.adminService.getAuditLogs(query, getRequestUser(req));
  }

  @Get('sensor-types')
  getSensorTypes(@Query() query: any, @Req() req: any) {
    return this.adminService.getSensorTypeStats(query, getRequestUser(req));
  }

  @Get('data-volume-by-sport')
  getDataVolume(@Query() query: any, @Req() req: any) {
    return this.adminService.getDataVolumePerSport(query, getRequestUser(req));
  }

  @Get('users')
  getUsers(@Query() query: any, @Req() req: any) {
    return this.adminService.getUsers(query, getRequestUser(req));
  }

  @Get('sensor-catalog')
  getSensorCatalog() {
    return this.adminService.getSensorCatalog();
  }

  @Get('trainer-assignments')
  getTrainerAssignments(@Req() req: any) {
    return this.adminService.getTrainerAssignments(getRequestUser(req));
  }

  @Post('users')
  createUser(@Body() body: any, @Req() req: any) {
    return this.adminService.createUser(body, getRequestUser(req));
  }

  @Patch('users/:userId/role')
  updateUserRole(@Param('userId') userId: string, @Body() body: any, @Req() req: any) {
    return this.adminService.updateUserRole(userId, body, getRequestUser(req));
  }

  @Post('sensor-types')
  upsertSensorType(@Body() body: any, @Req() req: any) {
    return this.adminService.upsertSensorType(body, getRequestUser(req));
  }

  @Patch('trainers/:trainerId/athletes')
  updateTrainerAssignment(@Param('trainerId') trainerId: string, @Body() body: any, @Req() req: any) {
    return this.adminService.updateTrainerAthleteAssignment(trainerId, body, getRequestUser(req));
  }
}

