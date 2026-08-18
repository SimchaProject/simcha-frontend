export interface RsvpPayload {
  name: string
  phone: string
  partySize: number
  attending: boolean
  dietaryNotes?: string
  needsTransport?: boolean
  // SIM-15 singles corner. Only offered when the couple enabled it, and the
  // server ignores it on a decline.
  openToMingle?: boolean
  mingleAge?: number
  mingleBio?: string
}

export interface RsvpResponse {
  id: string
  // The guest's status before this submission - 'ATTENDING' or 'DECLINED'
  // only if they'd already given a real answer before; null on a first
  // response (including a couple-loaded placeholder that was still PENDING).
  previousStatus: 'ATTENDING' | 'DECLINED' | null
  // Returned once, only when this submission opted into the singles corner.
  // It's the guest's key to the list - there's no other way to get it back,
  // so the success screen has to hand it over as a link.
  mingleToken: string | null
}

export interface MinglePerson {
  id: string
  firstName: string
  age: number | null
  bio: string | null
  isYou: boolean
}

export interface MingleList {
  coupleNameA: string
  coupleNameB: string
  people: MinglePerson[]
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
