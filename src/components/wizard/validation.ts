import type { WizardData } from './types'

export function validateBasics(data: WizardData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (data.coupleNameA.trim().length < 2) errors.coupleNameA = 'נא להזין שם'
  if (data.coupleNameB.trim().length < 2) errors.coupleNameB = 'נא להזין שם'
  if (!data.date) {
    errors.date = 'נא לבחור תאריך'
  } else if (new Date(data.date) < new Date(new Date().toDateString())) {
    errors.date = 'התאריך צריך להיות בעתיד'
  }
  if (data.venue.trim().length < 2) errors.venue = 'נא להזין מקום'
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug)) {
    errors.slug = 'כתובת יכולה להכיל רק אותיות באנגלית קטנות, מספרים ומקפים'
  }
  return errors
}
