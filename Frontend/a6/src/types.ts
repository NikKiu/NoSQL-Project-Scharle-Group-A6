export type Role = 'athlete' | 'trainer' | 'admin'

export interface ApiAuth {
  userId: string
  role: Role
}

export interface User {
  id?: string
  userId?: string
  email: string
  role: Role
  athleteId?: string | null
  trainerAthleteIds?: string[]
  name?: string
  password?: string
}

export interface AuthResponse {
  auth: ApiAuth
  user: User
}

export interface LoadZoneRange {
  min: number
  max: number
}

export interface AthleteProfile {
  id?: string
  athleteId: string
  userId: string
  firstName: string
  lastName: string
  birthDate: string
  gender?: string
  weightKg?: number
  heightCm?: number
  trainingLevel?: string
  sports: string[]
  loadZones?: {
    z1?: LoadZoneRange
    z2?: LoadZoneRange
    z3?: LoadZoneRange
    z4?: LoadZoneRange
    z5?: LoadZoneRange
  }
  createdAt?: string
  updatedAt?: string
}

export interface Sportler extends AthleteProfile {
  level?: 'beginner' | 'intermediate' | 'advanced'
  zones?: { hr?: number[]; pace?: string[] }
}

export interface TrainingSession {
  sessionId: string
  athleteId: string
  sport: string
  status: 'active' | 'finished' | string
  sensorTypes: string[]
  startAt: string
  endAt?: string | null
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface Training {
  id: string
  athleteId?: string
  sportlerId?: string
  sport: string
  startTs: string
  endTs?: string
  metrics?: { maxSpeedKmh?: number; avgHr?: number; avgSpeedKmh?: number }
}

export interface SensorEvent {
  eventId?: string
  athleteId?: string
  sessionId: string
  timestamp: string
  sensorType: string
  metrics?: Record<string, unknown>
  heartRate?: number
  speed?: number
  distanceDelta?: number
  lat?: number
  lon?: number
  powerW?: number
}

export interface GpsTrackPoint {
  timestamp: string
  lat: number
  lon: number
  speed?: number | null
  distanceDelta?: number | null
}

export interface SessionSensorBreakdown {
  _id: string
  eventCount: number
  metrics: Record<string, number | null>
}

export interface DetailedSessionAnalysis {
  sessionId: string
  summary: Record<string, unknown>
  timeSeriesData: Array<{
    _id: string
    avgHeartRate?: number | null
    avgSpeed?: number | null
    distanceCovered?: number | null
    eventCount?: number
  }>
  bySensorType: SessionSensorBreakdown[]
  gpsTrack: GpsTrackPoint[]
  athlete?: {
    athleteId: string
    name: string
    trainingLevel?: string | null
  } | null
}

export interface TimePoint {
  ts: string
  hr?: number
  speedKmh?: number
  lat?: number
  lon?: number
  powerW?: number
}

export interface TimeSeries {
  trainingId: string
  athleteId?: string
  sportlerId?: string
  points: TimePoint[]
}

export interface Sensor {
  id?: string
  name: string
  type: string
  details?: string
}

export interface SensorCatalogItem {
  sensorType: string
  displayName: string
  unit?: string | null
  description?: string | null
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
  createdAt?: string
  updatedAt?: string
}

export interface SimulatedSampleResponse {
  insertedCount: number
  timestamp: string
  events: SensorEvent[]
  sample: {
    heartRate?: number
    speed?: number
    distanceDelta?: number
    lat?: number
    lon?: number
    powerW?: number
  }
}

export interface SessionSummary {
  sessionId: string
  athleteId: string
  sport: string
  status: string
  startAt: string
  endAt?: string | null
  avgHeartRate?: number | null
  maxHeartRate?: number | null
  maxSpeed?: number | null
  totalDistance?: number | null
  eventCount?: number
  firstEventAt?: string | null
  lastEventAt?: string | null
}

export interface AthleteHistoryResponse {
  athleteId: string
  sessions: SessionSummary[]
}

export interface MetricPoint {
  label: string
  value: number | string | null
}

export interface TrainerAssignment {
  trainerId: string
  trainerEmail: string
  trainerName?: string
  trainerAthleteIds: string[]
  assignedAthletes: Array<{
    athleteId: string
    name: string
    sports: string[]
    trainingLevel?: string | null
  }>
}

