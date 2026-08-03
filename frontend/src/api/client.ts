// Single place where the front end talks to the A3 backend. Vite proxies /api
// to http://localhost:4000 in development (see vite.config.ts), so paths here
// stay relative.

const TOKEN_KEY = 'queuesmart.token'

/** Mirrors the backend's { error: { code, message, fields } } response body. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  /**
   * What to show the user. Prefers the first field-level message, since
   * "Password must be at least 6 characters." is more useful than the generic
   * "One or more fields are invalid."
   */
  get displayMessage(): string {
    const first = this.fields ? Object.values(this.fields)[0] : undefined
    return first ?? this.message
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch<T>(path: string, method: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // fetch only rejects when the request never completed - backend is down,
    // or the dev proxy has nothing to talk to.
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Is the backend running?')
  }

  // 204 No Content (logout) has no body to parse.
  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = data?.error
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? 'Something went wrong.',
      error?.fields
    )
  }

  return data as T
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, 'GET')
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, 'POST', body)
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, 'PUT', body)
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, 'PATCH', body)
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, 'DELETE')
}
