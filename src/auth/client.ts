import { createAuthClient } from 'better-auth/react'

// Same relative-in-production fallback as api/http.ts - see the comment
// there for why this needs to resolve to the app's own origin.
const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')

export const authClient = createAuthClient({
  baseURL,
})
