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
  // Computed server-side by the reminder cron - read-only, never toggled
  // manually. The button just appears when due.
  isReminderDue: boolean
  reminderWaMeLink: string | null
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
