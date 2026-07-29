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

// Partial update body for PATCH /weddings/:weddingId/guest-page-config -
// every field optional.
export type GuestPageConfigUpdate = Partial<GuestPageConfig>

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
