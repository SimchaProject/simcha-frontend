import { useEffect, useState } from 'react'

// The backend is on Render's free tier and spins down after 15 minutes
// idle - the first request after that can take up to ~30-60s to wake it
// back up. Without this, that wait looks identical to the app being
// broken. Delete this whole hook (and its call sites) once hosting is
// upgraded to a plan that stays warm.
export function useSlowConnection(active: boolean, delayMs = 5000): boolean {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!active) {
      setSlow(false)
      return
    }
    const timer = setTimeout(() => setSlow(true), delayMs)
    return () => clearTimeout(timer)
  }, [active, delayMs])

  return slow
}
