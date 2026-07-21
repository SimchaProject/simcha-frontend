import { http } from './http'
import type { RsvpPayload, RsvpResponse } from '../types/rsvp'

export const rsvpApi = {
  submit: (weddingSlug: string, payload: RsvpPayload) =>
    http.post<RsvpResponse>(`/weddings/${weddingSlug}/rsvp`, payload),
}
