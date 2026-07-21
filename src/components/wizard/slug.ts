// Rough phonetic Hebrew->Latin map so slug auto-generation produces something
// readable for our (Hebrew-first) names, rather than always falling back to
// a random string. Not linguistically precise — just good enough for a URL.
const HEBREW_TRANSLITERATION: Record<string, string> = {
  א: '',
  ב: 'b',
  ג: 'g',
  ד: 'd',
  ה: 'h',
  ו: 'v',
  ז: 'z',
  ח: 'ch',
  ט: 't',
  י: 'y',
  כ: 'k',
  ך: 'k',
  ל: 'l',
  מ: 'm',
  ם: 'm',
  נ: 'n',
  ן: 'n',
  ס: 's',
  ע: '',
  פ: 'p',
  ף: 'p',
  צ: 'tz',
  ץ: 'tz',
  ק: 'k',
  ר: 'r',
  ש: 'sh',
  ת: 't',
}

function transliterate(text: string): string {
  return text
    .split('')
    .map((ch) => HEBREW_TRANSLITERATION[ch] ?? ch)
    .join('')
}

export function slugify(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function generateSlug(nameA: string, nameB: string): string {
  const base = slugify(`${nameA}-${nameB}`)
  return base || Math.random().toString(36).slice(2, 8)
}
