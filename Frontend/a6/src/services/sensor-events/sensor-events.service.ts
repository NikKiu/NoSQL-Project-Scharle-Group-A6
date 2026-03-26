import { apiRequest, buildQuery } from '../core/http'
import type { SensorEvent, SimulatedSampleResponse } from '../../types'

export const sensorEventsService = {
  create(body: SensorEvent) {
    return apiRequest<SensorEvent>('/sensor-events', { method: 'POST', body })
  },

  simulateSample(body: { sessionId: string; timestamp?: string }) {
    return apiRequest<SimulatedSampleResponse>('/sensor-events/simulate', {
      method: 'POST',
      body
    })
  },

  getRecentForAthlete(athleteId: string, query?: Record<string, string | number | boolean | undefined | null>) {
    return apiRequest<SensorEvent[]>(
      `/athletes/${encodeURIComponent(athleteId)}/sensor-events/recent${buildQuery(query)}`
    )
  }
}

