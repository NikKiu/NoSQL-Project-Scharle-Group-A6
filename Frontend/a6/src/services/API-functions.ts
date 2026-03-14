type BackendRole = 'admin' | 'trainer' | 'athlete'

export interface ApiAuth {
  userId: string
  role: BackendRole
}

export interface ApiClientOptions {
  baseUrl?: string
  auth?: ApiAuth
  extraHeaders?: Record<string, string>
}

const DEFAULT_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL ?? '/api'

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>) {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    searchParams.set(key, String(value))
  }
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

async function request<T>(
  path: string,
  options: ApiClientOptions & {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
  } = {}
): Promise<T> {
  const { baseUrl = DEFAULT_BASE_URL, auth, extraHeaders, method = 'GET', body } = options
  const headers: Record<string, string> = { ...(extraHeaders ?? {}) }

  if (auth) {
    headers['x-user-id'] = auth.userId
    headers['x-role'] = auth.role
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`)
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  return (await res.text()) as unknown as T
}

export function createApiClient(options: ApiClientOptions = {}) {
  const withDefaults = (opts?: ApiClientOptions) => ({ ...options, ...(opts ?? {}) })
  return {
    health: () => getHealth(withDefaults()),

    createAthlete: <T = unknown>(body: unknown, opts?: ApiClientOptions) =>
      createAthlete<T>(body, withDefaults(opts)),
    listAthletes: <T = unknown>(query?: Record<string, any>, opts?: ApiClientOptions) =>
      listAthletes<T>(query, withDefaults(opts)),
    getAthlete: <T = unknown>(athleteId: string, opts?: ApiClientOptions) =>
      getAthlete<T>(athleteId, withDefaults(opts)),
    updateAthlete: <T = unknown>(athleteId: string, body: unknown, opts?: ApiClientOptions) =>
      updateAthlete<T>(athleteId, body, withDefaults(opts)),
    deleteAthlete: <T = unknown>(athleteId: string, opts?: ApiClientOptions) =>
      deleteAthlete<T>(athleteId, withDefaults(opts)),

    createSession: <T = unknown>(body: unknown, opts?: ApiClientOptions) =>
      createSession<T>(body, withDefaults(opts)),
    getSession: <T = unknown>(sessionId: string, opts?: ApiClientOptions) =>
      getSession<T>(sessionId, withDefaults(opts)),
    listSessionsForAthlete: <T = unknown>(athleteId: string, query?: Record<string, any>, opts?: ApiClientOptions) =>
      listSessionsForAthlete<T>(athleteId, query, withDefaults(opts)),
    finishSession: <T = unknown>(sessionId: string, body: unknown, opts?: ApiClientOptions) =>
      finishSession<T>(sessionId, body, withDefaults(opts)),

    createSensorEvent: <T = unknown>(body: unknown, opts?: ApiClientOptions) =>
      createSensorEvent<T>(body, withDefaults(opts)),
    createSensorEventBatch: <T = unknown>(body: unknown, opts?: ApiClientOptions) =>
      createSensorEventBatch<T>(body, withDefaults(opts)),
    getRecentSensorEventsForAthlete: <T = unknown>(
      athleteId: string,
      seconds?: number,
      opts?: ApiClientOptions
    ) => getRecentSensorEventsForAthlete<T>(athleteId, seconds, withDefaults(opts)),

    getAverageHeartRate: <T = unknown>(athleteId: string, query: { from?: string; to?: string }, opts?: ApiClientOptions) =>
      getAverageHeartRate<T>(athleteId, query, withDefaults(opts)),
    getSessionSummary: <T = unknown>(sessionId: string, opts?: ApiClientOptions) =>
      getSessionSummary<T>(sessionId, withDefaults(opts)),
    getAthleteHistory: <T = unknown>(athleteId: string, query: { from?: string; to?: string }, opts?: ApiClientOptions) =>
      getAthleteHistory<T>(athleteId, query, withDefaults(opts)),
    calculateLoadZones: <T = unknown>(athleteId: string, body: unknown, opts?: ApiClientOptions) =>
      calculateLoadZones<T>(athleteId, body, withDefaults(opts))
  }
}

export function getHealth<T = unknown>(opts?: ApiClientOptions) {
  return request<T>('/health', opts)
}

// Athletes
export function createAthlete<T = unknown>(body: unknown, opts?: ApiClientOptions) {
  return request<T>('/athletes', { ...opts, method: 'POST', body })
}

export function listAthletes<T = unknown>(query?: Record<string, any>, opts?: ApiClientOptions) {
  return request<T>(`/athletes${buildQuery(query)}`, opts)
}

export function getAthlete<T = unknown>(athleteId: string, opts?: ApiClientOptions) {
  return request<T>(`/athletes/${encodeURIComponent(athleteId)}`, opts)
}

export function updateAthlete<T = unknown>(athleteId: string, body: unknown, opts?: ApiClientOptions) {
  return request<T>(`/athletes/${encodeURIComponent(athleteId)}`, { ...opts, method: 'PATCH', body })
}

export function deleteAthlete<T = unknown>(athleteId: string, opts?: ApiClientOptions) {
  return request<T>(`/athletes/${encodeURIComponent(athleteId)}`, { ...opts, method: 'DELETE' })
}

// Sessions
export function createSession<T = unknown>(body: unknown, opts?: ApiClientOptions) {
  return request<T>('/sessions', { ...opts, method: 'POST', body })
}

export function getSession<T = unknown>(sessionId: string, opts?: ApiClientOptions) {
  return request<T>(`/sessions/${encodeURIComponent(sessionId)}`, opts)
}

export function listSessionsForAthlete<T = unknown>(
  athleteId: string,
  query?: Record<string, any>,
  opts?: ApiClientOptions
) {
  return request<T>(`/athletes/${encodeURIComponent(athleteId)}/sessions${buildQuery(query)}`, opts)
}

export function finishSession<T = unknown>(sessionId: string, body: unknown, opts?: ApiClientOptions) {
  return request<T>(`/sessions/${encodeURIComponent(sessionId)}/finish`, { ...opts, method: 'PATCH', body })
}

// Sensor Events
export function createSensorEvent<T = unknown>(body: unknown, opts?: ApiClientOptions) {
  return request<T>('/sensor-events', { ...opts, method: 'POST', body })
}

export function createSensorEventBatch<T = unknown>(body: unknown, opts?: ApiClientOptions) {
  return request<T>('/sensor-events/batch', { ...opts, method: 'POST', body })
}

export function getRecentSensorEventsForAthlete<T = unknown>(
  athleteId: string,
  seconds?: number,
  opts?: ApiClientOptions
) {
  return request<T>(
    `/athletes/${encodeURIComponent(athleteId)}/sensor-events/recent${buildQuery({ seconds })}`,
    opts
  )
}

// Analytics
export function getAverageHeartRate<T = unknown>(
  athleteId: string,
  query: { from?: string; to?: string },
  opts?: ApiClientOptions
) {
  return request<T>(
    `/analytics/athletes/${encodeURIComponent(athleteId)}/average-heart-rate${buildQuery(query)}`,
    opts
  )
}

export function getSessionSummary<T = unknown>(sessionId: string, opts?: ApiClientOptions) {
  return request<T>(`/analytics/sessions/${encodeURIComponent(sessionId)}/summary`, opts)
}

export function getAthleteHistory<T = unknown>(
  athleteId: string,
  query: { from?: string; to?: string },
  opts?: ApiClientOptions
) {
  return request<T>(
    `/analytics/athletes/${encodeURIComponent(athleteId)}/history${buildQuery(query)}`,
    opts
  )
}

export function calculateLoadZones<T = unknown>(athleteId: string, body: unknown, opts?: ApiClientOptions) {
  return request<T>(`/analytics/athletes/${encodeURIComponent(athleteId)}/load-zones/calculate`, {
    ...opts,
    method: 'POST',
    body
  })
}
