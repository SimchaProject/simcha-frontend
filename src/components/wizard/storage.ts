import type { WizardData } from './types'

const KEY_PREFIX = 'simcha_wizard_'

export function loadWizardData(coupleId: string): WizardData | null {
  const raw = localStorage.getItem(KEY_PREFIX + coupleId)
  if (!raw) return null
  try {
    return JSON.parse(raw) as WizardData
  } catch {
    return null
  }
}

export function saveWizardData(coupleId: string, data: WizardData) {
  localStorage.setItem(KEY_PREFIX + coupleId, JSON.stringify(data))
}

export function clearWizardData(coupleId: string) {
  localStorage.removeItem(KEY_PREFIX + coupleId)
}
