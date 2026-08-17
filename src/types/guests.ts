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
  respondedAt: string | null
  createdAt: string
  updatedAt: string
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
  groupId?: string
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
