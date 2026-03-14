import { ForbiddenException, Injectable } from '@nestjs/common';
import { MongoService } from '../mongo.service';
import { RequestUser } from '../common/auth/auth.types';
import { parseDate, parseOptionalDate } from '../common/utils/parse';
import * as AggPipeline from '../pipeline/aggregatedData';

@Injectable()
export class AdminService {
  constructor(private readonly mongoService: MongoService) {}

  /** Wirft 403, wenn der anfragende Nutzer kein Admin ist. */
  private requireAdmin(user: RequestUser): void {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Dieser Endpunkt ist nur für Administratoren zugänglich');
    }
  }

  /** F14, F16, NF1, NF3 – US 8: Schreibrate & Latenz überwachen */
  async getSystemMetrics(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    const intervalMinutes = Number(query.intervalMinutes) || 5;
    return AggPipeline.getSystemMetrics(this.mongoService.getDb(), from, to, intervalMinutes);
  }

  /** NF1, NF3, F14 – US 8: Schreib-Performance überwachen */
  async getWritePerformance(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    const groupByMinutes = Number(query.groupByMinutes) || 1;
    return AggPipeline.getWritePerformanceMetrics(this.mongoService.getDb(), from, to, groupByMinutes);
  }

  /** F15, F23, NF7 – US 11: Audit-Logs einsehen */
  async getAuditLogs(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const from = parseDate(query.from, 'from');
    const to = parseDate(query.to, 'to');
    return AggPipeline.getAuditLogSummary(this.mongoService.getDb(), from, to, query.action);
  }

  /** F13, F16 – US 9, US 12: Sensortypen-Statistiken */
  async getSensorTypeStats(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');
    return AggPipeline.getSensorTypeUsageStats(this.mongoService.getDb(), from, to);
  }

  /** F16 – US 12: Datenvolumen pro Sportart */
  async getDataVolumePerSport(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const from = parseOptionalDate(query.from, 'from');
    const to = parseOptionalDate(query.to, 'to');
    return AggPipeline.getDataVolumePerSport(this.mongoService.getDb(), from, to);
  }

  /** F12, F23, NF7 – US 10: Nutzerverwaltung */
  async getUsers(query: any, user: RequestUser) {
    this.requireAdmin(user);
    const filter: any = {};
    if (query.role) filter.role = query.role;
    return this.mongoService
      .getDb()
      .collection('users')
      .find(filter, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
  }
}
