export type RsvpStatus = 'PENDING' | 'ATTENDING' | 'DECLINED'

export interface Guest {
  id: string
  weddingId: string
  name: string
  phone: string | null
  partySize: number
  groupId: string | null
  rsvpStatus: RsvpStatus
  dietaryNotes: string | null
  needsTransport: boolean
  // SIM-15: set by the guest themselves on the RSVP form, shown to the
  // couple as an indicator only. The token that opens the singles list is
  // never sent to the dashboard.
  openToMingle: boolean
  mingleAge: number | null
  mingleBio: string | null
  respondedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateGuestPayload {
  name: string
  phone?: string
  partySize?: number
  // null is "no group" and is what the form sends when the select is left on
  // "ללא קבוצה"; the API treats null and undefined the same on create, and
  // uses null to unlink an existing group on update.
  groupId?: string | null
}

export interface UpdateGuestPayload {
  name?: string
  phone?: string
  partySize?: number
  groupId?: string | null
  rsvpStatus?: RsvpStatus
  dietaryNotes?: string
  needsTransport?: boolean
}

export interface GuestListFilters {
  rsvpStatus?: RsvpStatus
  groupId?: string
  reminderDue?: boolean
}

export interface BulkImportResult {
  importedCount: number
  updatedCount: number
  skippedCount: number
  errors: Array<{ row: number; message: string }>
}

export interface InviteSendResult {
  sentCount: number
  failedCount: number
  skippedNoPhoneCount: number
  errors: Array<{ guestId: string; name: string; message: string }>
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
