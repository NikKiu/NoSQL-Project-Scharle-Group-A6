import { apiRequest } from '../core/http'
import type { ApiAuth, AuthResponse } from '../../types'

export interface AuthMutationInput {
  email: string
  password: string
  role?: string
  name?: string
}

export const authService = {
  register(body: AuthMutationInput, auth?: ApiAuth | null) {
    return apiRequest<AuthResponse>('/auth/register', { method: 'POST', body, auth })
  },

  login(body: AuthMutationInput) {
    return apiRequest<AuthResponse>('/auth/login', { method: 'POST', body, auth: null })
  },

  me(auth?: ApiAuth | null) {
    return apiRequest<AuthResponse>('/auth/me', { auth })
  }
}

