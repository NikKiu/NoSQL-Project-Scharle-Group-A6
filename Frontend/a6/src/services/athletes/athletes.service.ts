import { apiRequest, buildQuery } from '../core/http'
import type { AthleteProfile } from '../../types'

export const athletesService = {
  create(body: Partial<AthleteProfile>) {
    return apiRequest<AthleteProfile>('/athletes', { method: 'POST', body })
  },

  list(query?: Record<string, string | number | boolean | undefined | null>) {
    return apiRequest<AthleteProfile[]>(`/athletes${buildQuery(query)}`)
  },

  getById(athleteId: string) {
    return apiRequest<AthleteProfile>(`/athletes/${encodeURIComponent(athleteId)}`)
  },

  update(athleteId: string, body: Partial<AthleteProfile>) {
    return apiRequest<AthleteProfile>(`/athletes/${encodeURIComponent(athleteId)}`, {
      method: 'PATCH',
      body
    })
  },

  remove(athleteId: string) {
    return apiRequest<{ deleted: boolean; athleteId: string }>(`/athletes/${encodeURIComponent(athleteId)}`, {
      method: 'DELETE'
    })
  }
}

