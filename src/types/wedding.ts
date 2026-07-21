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
}

export interface GuestPageConfigInput {
  theme: string
  welcomeMessage?: string
  heroPhotoUrl?: string
  ceremonyTime?: string
  rsvpDeadline?: string
  dressCode?: string
  contactPhone?: string
}

export interface GuestPageConfig {
  id: string
  weddingId: string
  theme: string
  welcomeMessage: string | null
  heroPhotoUrl: string | null
  ceremonyTime: string | null
  rsvpDeadline: string | null
  dressCode: string | null
  contactPhone: string | null
}

export interface PublicGuestPageConfig {
  theme: string
  welcomeMessage: string | null
  heroPhotoUrl: string | null
  ceremonyTime: string | null
  rsvpDeadline: string | null
  dressCode: string | null
}

export interface PublicWedding {
  coupleNameA: string
  coupleNameB: string
  date: string
  venue: string
  slug: string
  guestPageConfig: PublicGuestPageConfig | null
}

export interface CreateWeddingPayload {
  coupleNameA: string
  coupleNameB: string
  date: string
  venue: string
  slug: string
  guestPageConfig: GuestPageConfigInput
}
