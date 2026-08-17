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
  // The guest's status before this submission - 'ATTENDING' or 'DECLINED'
  // only if they'd already given a real answer before; null on a first
  // response (including a couple-loaded placeholder that was still PENDING).
  previousStatus: 'ATTENDING' | 'DECLINED' | null
}

// A locally-detected guest change, surfaced by diffing successive polls of
// the guest list (see GuestsPage) - not a server-pushed event.
export interface RsvpSubmittedEvent {
  guestId: string
  name: string
  partySize: number
  rsvpStatus: 'PENDING' | 'ATTENDING' | 'DECLINED'
  dietaryNotes: string | null
  respondedAt: string
  timestamp: string
}
