import { http } from './http'
import type { OptimizeResponse, SeatingSnapshot } from '../types/seating'

export const seatingApi = {
  getSnapshot: (weddingId: string) =>
    http.get<SeatingSnapshot>(`/weddings/${weddingId}/seating`),

  optimize: (weddingId: string) =>
    http.post<OptimizeResponse>(`/weddings/${weddingId}/seating/optimize`),

  reoptimize: (weddingId: string) =>
    http.post<OptimizeResponse>(`/weddings/${weddingId}/seating/reoptimize`),

  overrideAssignment: (weddingId: string, assignmentId: string, tableId: string | null) =>
    http.patch(`/weddings/${weddingId}/seating/assignments/${assignmentId}`, { tableId }),
}
