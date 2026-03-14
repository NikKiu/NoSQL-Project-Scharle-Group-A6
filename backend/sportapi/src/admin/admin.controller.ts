import { Controller, Get, Query, Req } from '@nestjs/common';
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
}

