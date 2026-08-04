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
  groupId?: string
}

export interface UpdateGuestPayload {
  name?: string
  phone?: string
  partySize?: number
  rsvpStatus?: RsvpStatus
  groupId?: string | null
}

export interface GuestGroup {
  id: string
  weddingId: string
  name: string
}

export interface CreateGuestGroupPayload {
  name: string
}

export interface UpdateGuestGroupPayload {
  name?: string
}
