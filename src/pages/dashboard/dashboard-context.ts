import { useOutletContext } from 'react-router-dom'
import type { Wedding } from '../../types/wedding'

export interface DashboardContext {
  wedding: Wedding
  refetchWedding: () => void
}

export function useDashboard() {
  return useOutletContext<DashboardContext>()
}
