import { http } from './http'
import type { RsvpLookupResponse, RsvpPayload, RsvpResponse } from '../types/rsvp'

export const rsvpApi = {
  submit: (weddingSlug: string, payload: RsvpPayload) =>
    http.post<RsvpResponse>(`/weddings/${weddingSlug}/rsvp`, payload),
  lookup: (weddingSlug: string, phone: string) =>
    http.post<RsvpLookupResponse>(`/weddings/${weddingSlug}/rsvp/lookup`, { phone }),
}
