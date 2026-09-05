import { http } from './http'
import type {
  BulkImportResult,
  CreateGuestPayload,
  Guest,
  GuestListFilters,
  InviteSendResult,
  UpdateGuestPayload,
} from '../types/guests'

function buildQuery(filters?: GuestListFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.rsvpStatus) params.set('rsvpStatus', filters.rsvpStatus)
  if (filters.groupId) params.set('groupId', filters.groupId)
  if (filters.reminderDue !== undefined) params.set('reminderDue', String(filters.reminderDue))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const guestsApi = {
  list: (weddingId: string, filters?: GuestListFilters) =>
    http.get<Guest[]>(`/weddings/${weddingId}/guests${buildQuery(filters)}`),
  create: (weddingId: string, payload: CreateGuestPayload) =>
    http.post<Guest>(`/weddings/${weddingId}/guests`, payload),
  update: (weddingId: string, guestId: string, payload: UpdateGuestPayload) =>
    http.patch<Guest>(`/weddings/${weddingId}/guests/${guestId}`, payload),
  remove: (weddingId: string, guestId: string) =>
    http.del<void>(`/weddings/${weddingId}/guests/${guestId}`),
  bulkImport: (weddingId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.postForm<BulkImportResult>(`/weddings/${weddingId}/guests/import`, form)
  },
  sendInvites: (weddingId: string, guestIds?: string[]) =>
    http.post<InviteSendResult>(`/weddings/${weddingId}/guests/invite`, guestIds ? { guestIds } : undefined),
  sendReminders: (weddingId: string, guestIds?: string[]) =>
    http.post<InviteSendResult>(`/weddings/${weddingId}/guests/remind`, guestIds ? { guestIds } : undefined),
  sendDayBeforeReminders: (weddingId: string, guestIds?: string[]) =>
    http.post<InviteSendResult>(
      `/weddings/${weddingId}/guests/remind-day-before`,
      guestIds ? { guestIds } : undefined,
    ),
}
