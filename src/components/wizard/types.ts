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
  ceremonyTime: string
  rsvpDeadline: string
  dressCode: string
  contactPhone: string
}

export const WIZARD_STEP_COUNT = 4

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
  ceremonyTime: '',
  rsvpDeadline: '',
  dressCode: '',
  contactPhone: '',
}
