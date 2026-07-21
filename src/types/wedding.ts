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
