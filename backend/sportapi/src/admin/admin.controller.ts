import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { getRequestUser } from '../common/auth/auth.utils';

/**
 * Admin Controller - Nur für Administratoren zugänglich
 * Prüfung erfolgt über x-role Header (role === 'admin')
 */
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/system-metrics
   * Query: from, to, intervalMinutes?
   * Anforderungen: F14, F16, NF1, NF3, US 8
   */
  @Get('system-metrics')
  getSystemMetrics(@Query() query: any, @Req() req: any) {
    return this.adminService.getSystemMetrics(query, getRequestUser(req));
  }

  /**
   * GET /admin/write-performance
   * Query: from, to, groupByMinutes?
   * Anforderungen: NF1, NF3, F14, US 8
   */
  @Get('write-performance')
  getWritePerformance(@Query() query: any, @Req() req: any) {
    return this.adminService.getWritePerformance(query, getRequestUser(req));
  }

  /**
   * GET /admin/audit-logs
   * Query: from, to, action?
   * Anforderungen: F15, F23, NF7, US 11
   */
  @Get('audit-logs')
  getAuditLogs(@Query() query: any, @Req() req: any) {
    return this.adminService.getAuditLogs(query, getRequestUser(req));
  }

  /**
   * GET /admin/sensor-types
   * Query: from?, to?
   * Anforderungen: F13, F16, US 9, US 12
   */
  @Get('sensor-types')
  getSensorTypes(@Query() query: any, @Req() req: any) {
    return this.adminService.getSensorTypeStats(query, getRequestUser(req));
  }

  /**
   * GET /admin/data-volume-by-sport
   * Query: from?, to?
   * Anforderungen: F16, US 12
   */
  @Get('data-volume-by-sport')
  getDataVolume(@Query() query: any, @Req() req: any) {
    return this.adminService.getDataVolumePerSport(query, getRequestUser(req));
  }

  /**
   * GET /admin/users
   * Query: role? (admin | trainer | athlete)
   * Anforderungen: F12, F23, NF7, US 10
   * Beispiel: GET /api/admin/users
   *           GET /api/admin/users?role=trainer
   */
  @Get('users')
  getUsers(@Query() query: any, @Req() req: any) {
    return this.adminService.getUsers(query, getRequestUser(req));
  }

  @Get('sensor-catalog')
  getSensorCatalog(@Req() req: any) {
    return this.adminService.getSensorCatalog(getRequestUser(req));
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

