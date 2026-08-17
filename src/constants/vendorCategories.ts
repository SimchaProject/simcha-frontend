export interface VendorCategoryPreset {
  id: string
  label: string
  icon: string
}

// Shared between VendorsPage (visual add-tiles) and BudgetPage (category
// quick-add suggestions) so the two stay in sync without a backend enum -
// vendor.category and budget category names both stay free text, this is
// just a shared set of starting suggestions.
export const VENDOR_CATEGORY_PRESETS: VendorCategoryPreset[] = [
  { id: 'venue', label: 'אולם / גן אירועים', icon: '🏛️' },
  { id: 'photographer', label: 'צלם/ת', icon: '📷' },
  { id: 'dj', label: 'תקליטן / DJ', icon: '🎧' },
  { id: 'band', label: 'להקה / זמר', icon: '🎤' },
  { id: 'catering', label: 'קייטרינג', icon: '🍽️' },
  { id: 'florist', label: 'סידורי פרחים', icon: '💐' },
  { id: 'cake', label: 'עוגה', icon: '🎂' },
  { id: 'makeup', label: 'איפור ושיער', icon: '💄' },
  { id: 'transport', label: 'הסעות', icon: '🚐' },
]

export const OTHER_CATEGORY: VendorCategoryPreset = { id: 'other', label: 'אחר', icon: '➕' }

export function iconForCategory(categoryLabel: string): string {
  const preset = VENDOR_CATEGORY_PRESETS.find((p) => p.label === categoryLabel)
  return preset?.icon ?? OTHER_CATEGORY.icon
}
