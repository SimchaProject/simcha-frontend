export interface RsvpPayload {
  name: string
  phone: string
  partySize: number
  attending: boolean
  dietaryNotes?: string
  needsTransport?: boolean
}

export interface RsvpResponse {
  id: string
  whatsappUrl: string
}

// A locally-detected guest change, surfaced by diffing successive polls of
// the guest list (see GuestListPage) - not a server-pushed event.
export interface RsvpSubmittedEvent {
  guestId: string
  name: string
  partySize: number
  rsvpStatus: 'PENDING' | 'ATTENDING' | 'DECLINED'
  dietaryNotes: string | null
  respondedAt: string
  timestamp: string
}
