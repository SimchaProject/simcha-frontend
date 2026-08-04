import { http } from './http'
import type { CreateGuestPayload, Guest, UpdateGuestPayload } from '../types/guest'

export const guestsApi = {
  list: (weddingId: string) => http.get<Guest[]>(`/weddings/${weddingId}/guests`),
  create: (weddingId: string, payload: CreateGuestPayload) =>
    http.post<Guest>(`/weddings/${weddingId}/guests`, payload),
  update: (weddingId: string, guestId: string, payload: UpdateGuestPayload) =>
    http.patch<Guest>(`/weddings/${weddingId}/guests/${guestId}`, payload),
  remove: (weddingId: string, guestId: string) =>
    http.delete<void>(`/weddings/${weddingId}/guests/${guestId}`),
}
