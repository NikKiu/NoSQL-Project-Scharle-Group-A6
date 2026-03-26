import { apiRequest, buildQuery } from '../core/http'
import type { DetailedSessionAnalysis, SessionSummary } from '../../types'

export const analyticsService = {
  getSessionSummary(sessionId: string) {
    return apiRequest<SessionSummary>(`/analytics/sessions/${encodeURIComponent(sessionId)}/summary`)
  },

  getPerformanceMetrics(athleteId: string, query?: { from?: string; to?: string }) {
    return apiRequest(`/analytics/athletes/${encodeURIComponent(athleteId)}/performance-metrics${buildQuery(query)}`)
  },

  getAllTimeStats(athleteId: string) {
    return apiRequest(`/analytics/athletes/${encodeURIComponent(athleteId)}/all-time-stats`)
  },

  getAveragePerSession(athleteId: string, query?: { limit?: number; sport?: string }) {
    return apiRequest(`/analytics/athletes/${encodeURIComponent(athleteId)}/avg-per-session${buildQuery(query)}`)
  },

  getSportStats(athleteId: string, query?: { from?: string; to?: string }) {
    return apiRequest(`/analytics/athletes/${encodeURIComponent(athleteId)}/sport-stats${buildQuery(query)}`)
  },

  getEnhancedHistory(athleteId: string, query?: { limit?: number }) {
    return apiRequest(`/analytics/athletes/${encodeURIComponent(athleteId)}/history-enhanced${buildQuery(query)}`)
  },

  getDetailedSession(sessionId: string) {
    return apiRequest<DetailedSessionAnalysis>(`/analytics/sessions/${encodeURIComponent(sessionId)}/detailed`)
  },

  getHeartRateZones(sessionId: string) {
    return apiRequest(`/analytics/sessions/${encodeURIComponent(sessionId)}/hr-zones`)
  },

  compareAthletes(body: { athleteIds: string[]; sport?: string; from?: string; to?: string }) {
    return apiRequest<Array<{
      athleteId: string
      athleteName?: string
      avgHeartRate?: number | null
      maxHeartRate?: number | null
      avgSpeed?: number | null
      maxSpeed?: number | null
      totalDistance?: number | null
      totalEvents?: number | null
      sessionCount?: number | null
    }>>('/analytics/compare-athletes', { method: 'POST', body })
  },

  getLiveOverview(body: { athleteIds: string[]; lastMinutes?: number }) {
    return apiRequest('/analytics/live-overview', { method: 'POST', body })
  },

  getLeaderboard(query: { sport: string; metric: string; limit?: number; from?: string; to?: string }) {
    return apiRequest(`/analytics/leaderboard${buildQuery(query)}`)
  },

  compareTrainingLevels(query: { sport: string; from?: string; to?: string }) {
    return apiRequest(`/analytics/compare-training-levels${buildQuery(query)}`)
  },

  getSessionsWithNotes(query?: { athleteId?: string; from?: string; to?: string }) {
    return apiRequest(`/analytics/sessions-with-notes${buildQuery(query)}`)
  }
}

