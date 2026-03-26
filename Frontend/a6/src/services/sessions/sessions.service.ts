import { apiRequest } from '../core/http'
import type { TrainingSession } from '../../types'

export const sessionsService = {
  create(body: Partial<TrainingSession> & { athleteId: string; sport: string; sensorTypes: string[] }) {
    return apiRequest<TrainingSession>('/sessions', { method: 'POST', body })
  },

  getById(sessionId: string) {
    return apiRequest<TrainingSession>(`/sessions/${encodeURIComponent(sessionId)}`)
  },

  finish(sessionId: string, body: { endAt?: string }) {
    return apiRequest<TrainingSession>(`/sessions/${encodeURIComponent(sessionId)}/finish`, {
      method: 'PATCH',
      body
    })
  },

  updateNotes(sessionId: string, body: { notes: string; append?: boolean }) {
    return apiRequest<TrainingSession>(`/sessions/${encodeURIComponent(sessionId)}/notes`, {
      method: 'PATCH',
      body
    })
  }
}

