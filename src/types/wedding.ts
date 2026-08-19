export interface ScheduleEntry {
  time: string
  label: string
}

export interface GuestPageConfig {
  id: string
  weddingId: string
  theme: string
  welcomeMessage: string | null
  heroPhotoUrl: string | null
  // Couple-authored day-of timeline.
  schedule: ScheduleEntry[]
  ceremonyTime: string | null
  rsvpDeadline: string | null
  dressCode: string | null
  mapUrl: string | null
  parkingInfo: string | null
  payboxLink: string | null
  bankTransferDetails: string | null
  // SIM-15: opens the singles-corner opt-in on the RSVP form. Off unless the
  // couple turns it on in settings.
  mingleEnabled: boolean
  // Used server-side to build the guest's post-RSVP wa.me link. Never sent
  // to the public invite page.
  contactPhone: string | null
}

// Partial update body for PATCH /weddings/:weddingId/guest-page-config.
export type GuestPageConfigUpdate = Partial<
  Omit<GuestPageConfig, 'id' | 'weddingId'>
>

export interface Wedding {
  id: string
  slug: string
  coupleNameA: string
  coupleNameB: string
  date: string
  venue: string
  createdBy: string
  createdAt: string
  updatedAt: string
  guestPageConfig: GuestPageConfig
}

// What the public invite page gets - deliberately narrower than Wedding
// (no createdBy/timestamps/contactPhone), served unauthenticated by slug.
export interface PublicGuestPageConfig {
  theme: string
  welcomeMessage: string | null
  heroPhotoUrl: string | null
  schedule: ScheduleEntry[]
  ceremonyTime: string | null
  rsvpDeadline: string | null
  dressCode: string | null
  mapUrl: string | null
  parkingInfo: string | null
  payboxLink: string | null
  bankTransferDetails: string | null
  mingleEnabled: boolean
}

export interface PublicWeddingInfo {
  id: string
  slug: string
  coupleNameA: string
  coupleNameB: string
  date: string
  venue: string
  guestPageConfig: PublicGuestPageConfig
}

export interface GuestPageConfigInput {
  theme: string
  welcomeMessage?: string
  heroPhotoUrl?: string
  schedule?: ScheduleEntry[]
  ceremonyTime?: string
  rsvpDeadline?: string
  dressCode?: string
  mapUrl?: string
  parkingInfo?: string
  payboxLink?: string
  bankTransferDetails?: string
  mingleEnabled?: boolean
  contactPhone?: string
}

export interface CreateWeddingPayload {
  coupleNameA: string
  coupleNameB: string
  date: string
  venue: string
  slug: string
  guestPageConfig: GuestPageConfigInput
}
