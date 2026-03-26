import { clearStoredAuthSession, readStoredAuthSession } from '../../lib/auth-storage'
import type { ApiAuth } from '../../types'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: ApiAuth | null
  extraHeaders?: Record<string, string>
  baseUrl?: string
  signal?: AbortSignal
}

const DEFAULT_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL ?? '/api'

function resolveAuth(explicitAuth?: ApiAuth | null): ApiAuth | null {
  if (explicitAuth) return explicitAuth
  return readStoredAuthSession()?.apiAuth ?? null
}

export function buildQuery(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return ''

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    searchParams.set(key, String(value))
  }

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    auth,
    extraHeaders,
    signal,
    baseUrl = DEFAULT_BASE_URL
  } = options

  const headers: Record<string, string> = { ...(extraHeaders ?? {}) }
  const effectiveAuth = resolveAuth(auth)

  if (effectiveAuth) {
    headers.Authorization = `Bearer ${effectiveAuth.token}`
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal
  })

  if (response.status === 401) {
    clearStoredAuthSession()
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`API ${method} ${path} failed (${response.status}): ${text}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return await response.json() as Promise<T>
  }

  return (await response.text()) as T
}

