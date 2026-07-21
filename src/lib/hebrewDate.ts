export const HEBREW_MONTH_NAMES = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
]

const HEBREW_WEEKDAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export function parseISODate(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function formatHebrewDate(value: string): string {
  const date = parseISODate(value)
  if (!date) return ''
  const weekday = HEBREW_WEEKDAY_NAMES[date.getDay()]
  const month = HEBREW_MONTH_NAMES[date.getMonth()]
  return `יום ${weekday}, ${date.getDate()} ב${month} ${date.getFullYear()}`
}
