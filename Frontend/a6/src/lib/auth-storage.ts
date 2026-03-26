import type { ApiAuth, User } from '../types'

export interface StoredAuthSession {
  user: User
  apiAuth: ApiAuth
}

export const AUTH_STORAGE_KEY = 'app:auth'

export function readStoredAuthSession(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredAuthSession
    if (!parsed?.user || !parsed?.apiAuth) return null
    return parsed
  } catch {
    return null
  }
}

export function writeStoredAuthSession(session: StoredAuthSession): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredAuthSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

