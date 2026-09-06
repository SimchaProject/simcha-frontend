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
  { id: 'videographer', label: 'צלם/ת וידאו', icon: '🎥' },
  { id: 'dj', label: 'תקליטן / DJ', icon: '🎧' },
  { id: 'band', label: 'להקה / זמר', icon: '🎤' },
  { id: 'catering', label: 'קייטרינג', icon: '🍽️' },
  { id: 'florist', label: 'סידורי פרחים', icon: '💐' },
  { id: 'cake', label: 'עוגה', icon: '🎂' },
  { id: 'makeup', label: 'איפור', icon: '💄' },
  { id: 'hair', label: 'עיצוב שיער', icon: '💇' },
  { id: 'transport', label: 'הסעות', icon: '🚐' },
]

export const OTHER_CATEGORY: VendorCategoryPreset = { id: 'other', label: 'אחר', icon: '➕' }

// null rather than a generic fallback icon: a couple's own category ("רב
// וטקס", "הסעות מהצפון") gets no icon at all, which reads better than a
// meaningless "➕" sitting next to it.
// A couple's own category name rarely matches a preset label exactly - the
// budget row says "אולם וקייטרינג", the preset says "אולם / גן אירועים" -
// so an exact match alone leaves almost every real category iconless. These
// keywords cover what people actually type.
const ICON_KEYWORDS: [string[], string][] = [
  [['אולם', 'גן אירוע', 'מקום'], '🏛️'],
  [['קייטרינג', 'אוכל', 'מזון'], '🍽️'],
  [['צילום', 'צלם', 'סטודיו'], '📷'],
  [['וידאו', 'וידיאו'], '🎥'],
  [['דיג', 'תקליטן', 'dj'], '🎧'],
  [['מוזיק', 'להקה', 'זמר', 'נגן'], '🎤'],
  [['פרח', 'עיצוב'], '💐'],
  [['עוגה', 'קינוח'], '🎂'],
  [['איפור', 'מאפר'], '💄'],
  [['שיער', 'תסרוק'], '💇'],
  [['הסע', 'הסעות', 'רכב'], '🚐'],
  [['שמלה', 'שמלת', 'חליפה', 'לבוש'], '👗'],
  [['רב', 'טקס', 'חופה'], '📜'],
  [['הזמנ', 'מעצב'], '✉️'],
]

export function iconForCategory(categoryLabel: string): string | null {
  const preset = VENDOR_CATEGORY_PRESETS.find((p) => p.label === categoryLabel)
  if (preset) return preset.icon

  const normalized = categoryLabel.toLowerCase()
  for (const [keywords, icon] of ICON_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return icon
  }
  return null
}
