import { http } from './http'
import type {
  CreateTablePayload,
  OptimizeResponse,
  SeatingSnapshot,
  SeatingTable,
  UpdateTablePayload,
} from '../types/seating'

export const seatingApi = {
  getSnapshot: (weddingId: string) =>
    http.get<SeatingSnapshot>(`/weddings/${weddingId}/seating`),

  optimize: (weddingId: string) =>
    http.post<OptimizeResponse>(`/weddings/${weddingId}/seating/optimize`),

  reoptimize: (weddingId: string) =>
    http.post<OptimizeResponse>(`/weddings/${weddingId}/seating/reoptimize`),

  assignGuest: (
    weddingId: string,
    guestId: string,
    tableId: string | null,
    seatIndex?: number | null,
  ) =>
    http.patch(`/weddings/${weddingId}/seating/guests/${guestId}/assignment`, {
      tableId,
      seatIndex: seatIndex ?? null,
    }),

  createTable: (weddingId: string, payload: CreateTablePayload) =>
    http.post<SeatingTable>(`/weddings/${weddingId}/seating/tables`, payload),

  updateTable: (weddingId: string, tableId: string, payload: UpdateTablePayload) =>
    http.patch<SeatingTable>(`/weddings/${weddingId}/seating/tables/${tableId}`, payload),

  deleteTable: (weddingId: string, tableId: string) =>
    http.del<void>(`/weddings/${weddingId}/seating/tables/${tableId}`),
}
