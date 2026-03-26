import { apiRequest, buildQuery } from '../core/http'
import type { SensorCatalogItem, TrainerAssignment, User } from '../../types'

export const adminService = {
  getSystemMetrics(query: { from: string; to: string; intervalMinutes?: number }) {
    return apiRequest(`/admin/system-metrics${buildQuery(query)}`)
  },

  getWritePerformance(query: { from: string; to: string; groupByMinutes?: number }) {
    return apiRequest(`/admin/write-performance${buildQuery(query)}`)
  },

  getAuditLogs(query: { from: string; to: string; action?: string }) {
    return apiRequest(`/admin/audit-logs${buildQuery(query)}`)
  },

  getSensorTypes(query?: { from?: string; to?: string }) {
    return apiRequest(`/admin/sensor-types${buildQuery(query)}`)
  },

  getDataVolumeBySport(query?: { from?: string; to?: string }) {
    return apiRequest(`/admin/data-volume-by-sport${buildQuery(query)}`)
  },

  getUsers(query?: { role?: string }) {
    return apiRequest<User[]>(`/admin/users${buildQuery(query)}`)
  },

  createUser(body: { email: string; password: string; role: string; name?: string; athleteId?: string }) {
    return apiRequest<{ created: boolean; user: User }>('/admin/users', { method: 'POST', body })
  },

  updateUserRole(userId: string, body: { role: User['role'] }) {
    return apiRequest<{ updated: boolean; user: User }>(`/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'PATCH',
      body
    })
  },

  getSensorCatalog() {
    return apiRequest<SensorCatalogItem[]>('/admin/sensor-catalog')
  },

  upsertSensorType(body: {
    sensorType: string
    displayName?: string
    unit?: string
    description?: string
    generatorType?: 'heart-rate' | 'gps' | 'power' | 'custom'
    generatorConfig?: {
      metricKey?: string
      base?: number
      amplitude?: number
      noise?: number
      min?: number
      max?: number
      frequencyDivisor?: number
    }
  }) {
    return apiRequest<SensorCatalogItem>('/admin/sensor-types', { method: 'POST', body })
  },

  getTrainerAssignments() {
    return apiRequest<TrainerAssignment[]>('/admin/trainer-assignments')
  },

  updateTrainerAthleteAssignment(trainerId: string, body: { action: 'add' | 'remove'; athleteId: string }) {
    return apiRequest<{ updated: boolean; trainerId: string; action: string; athleteId: string; trainerAthleteIds: string[] }>(
      `/admin/trainers/${encodeURIComponent(trainerId)}/athletes`,
      { method: 'PATCH', body }
    )
  }
}

