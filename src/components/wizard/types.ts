export interface BudgetCategoryDraft {
  id: string
  name: string
  allocatedAmount: string
}

export interface VendorDraft {
  id: string
  name: string
  category: string
  contactInfo: string
}

export interface WizardData {
  step: number
  coupleNameA: string
  coupleNameB: string
  date: string
  venue: string
  slug: string
  slugEdited: boolean
  theme: string
  welcomeMessage: string
  heroPhotoName: string
  totalBudget: string
  budgetCategories: BudgetCategoryDraft[]
  vendors: VendorDraft[]
}

export const WIZARD_STEP_COUNT = 5

export const initialWizardData: WizardData = {
  step: 1,
  coupleNameA: '',
  coupleNameB: '',
  date: '',
  venue: '',
  slug: '',
  slugEdited: false,
  theme: 'classic',
  welcomeMessage: '',
  heroPhotoName: '',
  totalBudget: '',
  budgetCategories: [],
  vendors: [],
}
