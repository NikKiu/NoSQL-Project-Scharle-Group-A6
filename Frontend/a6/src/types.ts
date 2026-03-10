export type Role = 'sportler' | 'trainer' | 'admin'

export interface User {
  id?: string
  email: string
  role: Role
  sportlerId?: string
  trainersportlerIds?: string[]
  name?: string;
  password?: string
}

export interface Sportler {
  id: string
  firstName: string
  lastName: string
  birthDate: string
  weightKg?: number
  heightCm?: number
  level?: 'beginner' | 'intermediate' | 'advanced'
  sports: string[]
  zones?: { hr?: number[]; pace?: string[] }
}

export interface Training {
  id: string
  sportlerId: string
  sport: string
  startTs: string
  endTs?: string
  metrics?: { maxSpeedKmh?: number; avgHr?: number; avgSpeedKmh?: number }
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
  sportlerId: string
  points: TimePoint[]
}

export interface Sensor {
  id?: string
  name: string
  type: string
  details?: string
}

