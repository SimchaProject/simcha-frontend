import { http } from './http'
import type { CreateGuestGroupPayload, GuestGroup, UpdateGuestGroupPayload } from '../types/guest'

export const guestGroupsApi = {
  list: (weddingId: string) => http.get<GuestGroup[]>(`/weddings/${weddingId}/guest-groups`),
  create: (weddingId: string, payload: CreateGuestGroupPayload) =>
    http.post<GuestGroup>(`/weddings/${weddingId}/guest-groups`, payload),
  update: (weddingId: string, groupId: string, payload: UpdateGuestGroupPayload) =>
    http.patch<GuestGroup>(`/weddings/${weddingId}/guest-groups/${groupId}`, payload),
  remove: (weddingId: string, groupId: string) =>
    http.delete<void>(`/weddings/${weddingId}/guest-groups/${groupId}`),
}
