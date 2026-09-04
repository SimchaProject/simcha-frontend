// In production this resolves to '' (relative) - Vercel's rewrites in
// vercel.json proxy /api/auth/*, /weddings/*, and /me through to the Render
// backend, so the browser only ever talks to simcha-frontend.vercel.app
// itself. That's what makes the session cookie first-party: Safari and
// Brave both block third-party cookies outright by default (regardless of
// SameSite=None), which broke login on iOS before this. Using `||` here
// (not `??`) so an accidentally-empty-but-present env var still falls back
// correctly, and gating the local fallback on DEV so a misconfigured
// production env var can't silently point at localhost.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')

// Nest's default exception filter returns { statusCode, message, error } -
// message is a single string for a thrown HttpException, or an array of
// strings for a class-validator ValidationPipe failure. Surface that message
// directly instead of the raw JSON blob so it's readable wherever a caller
// shows `String(e)` to the couple.
function extractErrorMessage(body: string, method: string, path: string, status: number): string {
  try {
    const parsed = JSON.parse(body)
    if (typeof parsed.message === 'string') return parsed.message
    if (Array.isArray(parsed.message)) return parsed.message.join(', ')
  } catch {
    // not JSON - fall through to the raw body
  }
  return `${method} ${path} failed (${status}): ${body}`
}

// Plain fetch() never times out on its own - if the backend is mid
// cold-start (Render's free tier spins the instance down after 15 minutes
// idle) or a connection genuinely stalls, a request just hangs forever,
// and every caller's "loading" state hangs right along with it since the
// promise never settles either way. 30s is generous enough not to fire
// during a normal cold start, while guaranteeing every screen eventually
// gets a real error it can show a retry button for instead of spinning
// indefinitely.
const REQUEST_TIMEOUT_MS = 30_000

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData bodies need the browser to set their own multipart boundary in
  // Content-Type — sending our own would drop the boundary and break parsing.
  const isFormData = init?.body instanceof FormData

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      // Auth is a Better Auth httpOnly session cookie, not a bearer token —
      // this is what makes the browser attach it to every request.
      credentials: 'include',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new Error(`${init?.method ?? 'GET'} ${path} timed out`)
    }
    throw e
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(extractErrorMessage(body, init?.method ?? 'GET', path, res.status))
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// For a plain <img src>, a relative backend path like the ones
// GuestPageConfig.heroPhotoUrl returns doesn't go through request() above,
// so it never picks up BASE_URL - the browser resolves it against whatever
// origin the current page happens to be on. In production that's fine (the
// Vercel proxy handles it), but in local dev the frontend and backend are
// genuinely different origins/ports. Only prefixes our own relative API
// paths - leaves blob:/http(s):// URLs (e.g. a local file preview) alone.
export function apiUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return path.startsWith('/') ? `${BASE_URL}${path}` : path
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData }),
}
