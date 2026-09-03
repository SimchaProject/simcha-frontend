import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './auth-context'
import { AppLoader } from '../components/ui/AppLoader'

/** The inverse of ProtectedRoute - keeps a signed-in couple off /login and
 * /signup instead of showing them the auth form again. DashboardLayout
 * itself sorts out whether they land on their dashboard or the wizard. */
export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { couple, isLoading } = useAuth()
  if (isLoading) return <AppLoader />
  if (couple) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
