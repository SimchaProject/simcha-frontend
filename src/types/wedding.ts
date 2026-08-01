export interface ScheduleEntry {
  time: string
  label: string
}

export interface GuestPageConfig {
  theme: string
  welcomeMessage: string | null
  heroPhotoUrl: string | null
  schedule: ScheduleEntry[]
  mapUrl: string | null
  parkingInfo: string | null
  payboxLink: string | null
  bankTransferDetails: string | null
}

// Only present on the authed /weddings/mine response - never sent to the
// public invite page, since it's server-side data used to build the
// guest's post-RSVP wa.me link, not guest-facing content.
export interface PrivateGuestPageConfig extends GuestPageConfig {
  contactPhone: string | null
}

// Partial update body for PATCH /weddings/:weddingId/guest-page-config -
// every field optional.
export type GuestPageConfigUpdate = Partial<PrivateGuestPageConfig>

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
  guestPageConfig: PrivateGuestPageConfig
}

// What the public invite page gets - deliberately narrower than Wedding
// (no createdBy/timestamps), served unauthenticated by slug.
export interface PublicWeddingInfo {
  id: string
  slug: string
  coupleNameA: string
  coupleNameB: string
  date: string
  venue: string
  guestPageConfig: GuestPageConfig
}

export interface GuestPageConfigInput {
  theme: string
  welcomeMessage?: string
  heroPhotoUrl?: string
}

export interface BudgetCategoryInput {
  name: string
  allocatedAmount: number
}

export interface BudgetInput {
  totalAmount: number
  categories?: BudgetCategoryInput[]
}

export interface VendorInput {
  name: string
  category: string
  contactInfo?: string
}

export interface CreateWeddingPayload {
  coupleNameA: string
  coupleNameB: string
  date: string
  venue: string
  slug: string
  guestPageConfig: GuestPageConfigInput
  budget?: BudgetInput
  vendors?: VendorInput[]
}
