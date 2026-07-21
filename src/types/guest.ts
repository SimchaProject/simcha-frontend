export type RsvpStatus = 'pending' | 'confirmed' | 'declined'

export interface Guest {
  id: string
  weddingId: string
  name: string
  phone: string | null
  partySize: number
  groupId: string | null
  rsvpStatus: RsvpStatus
}

export interface CreateGuestPayload {
  name: string
  phone?: string
  partySize?: number
}

export interface UpdateGuestPayload {
  name?: string
  phone?: string
  partySize?: number
  rsvpStatus?: RsvpStatus
}
