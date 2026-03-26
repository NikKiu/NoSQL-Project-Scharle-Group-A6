import { redirect, type LoaderFunctionArgs } from 'react-router-dom'
import { clearStoredAuthSession, readStoredAuthSession, writeStoredAuthSession } from '../lib/auth-storage'
import type { StoredAuthSession } from '../lib/auth-storage'
import { adminService, analyticsService, athletesService, authService, sensorEventsService, sessionsService } from '../services'
import type { Role, TrainingSession } from '../types'

function normalizeSeriesRows(input: any): any[] {
  if (Array.isArray(input)) return input
  if (Array.isArray(input?.sessions)) return input.sessions
  if (Array.isArray(input?.data)) return input.data
  if (Array.isArray(input?.results)) return input.results
  return []
}

function mapToChartPoints(input: any): Array<{ label: string; value: number }> {
  return normalizeSeriesRows(input)
    .map((row: any, index: number) => {
      const label =
        row?.sessionId ??
        row?.label ??
        row?.sport ??
        (row?.startAt ? new Date(row.startAt).toLocaleDateString() : `Punkt ${index + 1}`)
      const rawValue =
        row?.avgHeartRate ??
        row?.averageHeartRate ??
        row?.avgHr ??
        row?.heartRate ??
        row?.value
      const value = Number(rawValue)
      if (!Number.isFinite(value)) return null
      return { label: String(label), value }
    })
    .filter(Boolean) as Array<{ label: string; value: number }>
}

function roleHome(role: Role) {
  if (role === 'admin') return '/app/admin'
  if (role === 'trainer') return '/app/trainer'
  return '/app/athlete'
}

function requireSession(roles?: Role[]): StoredAuthSession {
  const session = readStoredAuthSession()
  if (!session) {
    throw redirect('/login')
  }

  if (roles && !roles.includes(session.user.role)) {
    throw redirect(roleHome(session.user.role))
  }

  return session
}

function lastDaysRange(days: number) {
  const to = new Date()
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  return {
    from: from.toISOString(),
    to: to.toISOString()
  }
}

function filterTrainerAthletes<T extends { athleteId: string }>(rows: T[], session: StoredAuthSession) {
  const assigned = session.user.trainerAthleteIds ?? []
  if (assigned.length === 0) return rows
  return rows.filter((row) => assigned.includes(row.athleteId))
}

export async function rootLoader() {
  const session = readStoredAuthSession()
  if (!session) return { session: null }

  try {
    const response = await authService.me(session.apiAuth)
    const normalizedSession: StoredAuthSession = { user: response.user, apiAuth: response.auth }
    writeStoredAuthSession(normalizedSession)
    return { session: normalizedSession }
  } catch {
    clearStoredAuthSession()
    return { session: null }
  }
}

export async function publicOnlyLoader() {
  const session = readStoredAuthSession()
  if (session) {
    throw redirect(roleHome(session.user.role))
  }
  return null
}

export async function indexRedirectLoader() {
  const session = readStoredAuthSession()
  throw redirect(session ? roleHome(session.user.role) : '/login')
}

export async function athleteOverviewLoader() {
  const session = requireSession(['athlete'])
  const athleteId = session.user.athleteId

  if (!athleteId) {
    return { athlete: null, stats: null, history: [] }
  }

  const [athlete, stats, history] = await Promise.all([
    athletesService.getById(athleteId),
    analyticsService.getAllTimeStats(athleteId),
    analyticsService.getEnhancedHistory(athleteId, { limit: 5 })
  ])

  return { athlete, stats, history: ((history as any)?.sessions ?? history ?? []) as TrainingSession[] }
}

export async function athleteTrainingLoader() {
  const session = requireSession(['athlete'])
  const athleteId = session.user.athleteId

  if (!athleteId) {
    return { athlete: null, sensorCatalog: [], recentEvents: [] }
  }

  const [athlete, sensorCatalog, recentEvents] = await Promise.all([
    athletesService.getById(athleteId),
    adminService.getSensorCatalog(),
    sensorEventsService.getRecentForAthlete(athleteId, { seconds: 900, limit: 25 })
  ])

  return { athlete, sensorCatalog, recentEvents }
}

export async function athleteHistoryLoader() {
  const session = requireSession(['athlete'])
  const athleteId = session.user.athleteId
  if (!athleteId) return { history: [], stats: null, heartRateSeries: [] }

  const [history, stats, avgPerSession] = await Promise.all([
    analyticsService.getEnhancedHistory(athleteId, { limit: 50 }),
    analyticsService.getSportStats(athleteId),
    analyticsService.getAveragePerSession(athleteId, { limit: 20 })
  ])

  return {
    history: ((history as any)?.sessions ?? history ?? []) as TrainingSession[],
    stats,
    heartRateSeries: mapToChartPoints(avgPerSession)
  }
}

export async function athleteSessionDetailLoader({ params }: LoaderFunctionArgs) {
  const session = requireSession(['athlete'])
  const sessionId = params.sessionId
  if (!sessionId) throw redirect('/app/athlete/history')

  const [trainingSession, summary, detailed] = await Promise.all([
    sessionsService.getById(sessionId),
    analyticsService.getSessionSummary(sessionId),
    analyticsService.getDetailedSession(sessionId)
  ])

  let heartRateZones: unknown = null
  try {
    heartRateZones = await analyticsService.getHeartRateZones(sessionId)
  } catch {
    heartRateZones = null
  }

  return { currentUser: session.user, trainingSession, summary, detailed, heartRateZones }
}

export async function athleteProfileLoader() {
  const session = requireSession(['athlete'])
  const athleteId = session.user.athleteId
  if (!athleteId) return { athlete: null }
  const athlete = await athletesService.getById(athleteId)
  return { athlete }
}

export async function trainerOverviewLoader() {
  const session = requireSession(['trainer'])
  const athletes = filterTrainerAthletes(await athletesService.list(), session)
  const athleteIds = athletes.map((athlete) => athlete.athleteId)

  const [liveOverview, leaderboard] = await Promise.all([
    athleteIds.length > 0 ? analyticsService.getLiveOverview({ athleteIds, lastMinutes: 15 }) : Promise.resolve([]),
    analyticsService.getLeaderboard({ sport: 'running', metric: 'speed', limit: 5 })
  ])

  return { athletes, liveOverview, leaderboard }
}

export async function trainerAthletesLoader() {
  const session = requireSession(['trainer'])
  const athletes = filterTrainerAthletes(await athletesService.list(), session)
  return { athletes }
}

export async function trainerAthleteHistoryLoader({ params }: LoaderFunctionArgs) {
  const session = requireSession(['trainer'])
  const athleteId = params.athleteId
  if (!athleteId) throw redirect('/app/trainer/athletes')

  const allowed = session.user.trainerAthleteIds ?? []
  if (allowed.length > 0 && !allowed.includes(athleteId)) {
    throw redirect('/app/trainer/athletes')
  }

  const range = lastDaysRange(30)
  const [athlete, history, performance, avgPerSession] = await Promise.all([
    athletesService.getById(athleteId),
    analyticsService.getEnhancedHistory(athleteId, { limit: 20 }),
    analyticsService.getPerformanceMetrics(athleteId, range),
    analyticsService.getAveragePerSession(athleteId, { limit: 20 })
  ])

  return {
    athlete,
    history: ((history as any)?.sessions ?? history ?? []) as TrainingSession[],
    performance,
    heartRateSeries: mapToChartPoints(avgPerSession)
  }
}

export async function trainerSessionDetailLoader({ params }: LoaderFunctionArgs) {
  const session = requireSession(['trainer']);
  const sessionId = params.sessionId;
  if (!sessionId) throw redirect('/app/trainer/athletes');

  const [sessionData, summary, detailed] = await Promise.all([
    sessionsService.getById(sessionId),
    analyticsService.getSessionSummary(sessionId),
    analyticsService.getDetailedSession(sessionId)
  ]);

  return {
    currentUser: session.user,
    sessionData,
    summary,
    detailed
  };
}

export async function trainerCompareLoader() {
  const session = requireSession(['trainer'])
  const athletes = filterTrainerAthletes(await athletesService.list(), session)
  const [notedSessions, levelComparison] = await Promise.all([
    analyticsService.getSessionsWithNotes(),
    analyticsService.compareTrainingLevels({ sport: 'running' })
  ])
  return { athletes, notedSessions, levelComparison }
}

export async function adminOverviewLoader() {
  requireSession(['admin'])
  const [users, sensorCatalog, dataVolume] = await Promise.all([
    adminService.getUsers(),
    adminService.getSensorCatalog(),
    adminService.getDataVolumeBySport()
  ])
  return { users, sensorCatalog, dataVolume }
}

export async function adminUsersLoader() {
  requireSession(['admin'])
  const users = await adminService.getUsers()
  return { users }
}

export async function adminSensorsLoader() {
  requireSession(['admin'])
  const range = lastDaysRange(30)
  const [sensorCatalog, sensorStats] = await Promise.all([
    adminService.getSensorCatalog(),
    adminService.getSensorTypes(range)
  ])
  return { sensorCatalog, sensorStats }
}

export async function adminMonitoringLoader() {
  requireSession(['admin'])
  const range = lastDaysRange(7)
  const [systemMetrics, writePerformance, auditLogs, dataVolume] = await Promise.all([
    adminService.getSystemMetrics({ ...range, intervalMinutes: 60 }),
    adminService.getWritePerformance({ ...range, groupByMinutes: 60 }),
    adminService.getAuditLogs(range),
    adminService.getDataVolumeBySport(range)
  ])
  return { systemMetrics, writePerformance, auditLogs, dataVolume }
}

export async function adminAssignmentsLoader() {
  requireSession(['admin']);
  const [assignments, athletes] = await Promise.all([
    adminService.getTrainerAssignments(),
    athletesService.list()
  ]);
  return { assignments, athletes };
}

