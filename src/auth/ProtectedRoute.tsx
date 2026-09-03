import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './auth-context'
import { AppLoader } from '../components/ui/AppLoader'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { couple, isLoading } = useAuth()
  if (isLoading) return <AppLoader />
  if (!couple) return <Navigate to="/login" replace />
  return <>{children}</>
}
