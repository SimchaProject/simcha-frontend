import type { CSSProperties } from 'react'

// Kept in sync by hand with simcha-backend's src/wedding/guest-page-theme.const.ts
// (id list only - the backend never renders anything, just stores/validates).
export const GUEST_PAGE_THEME_IDS = ['classic', 'rosewater', 'minimal', 'orchard', 'jewel'] as const
export type GuestPageThemeId = (typeof GUEST_PAGE_THEME_IDS)[number]

export type CardEdge = 'torn' | 'straight' | 'ornate'
export type CtaVariant = 'seal' | 'rect'

export interface GuestPageTheme {
  id: GuestPageThemeId
  label: string
  vibe: string
  paper: string
  paperDark: string
  ink: string
  inkMuted: string
  line: string
  /** Default value for --simcha-red - the couple can override with one of accentSwatches. */
  accent: string
  /** --simcha-gold - label/divider color, fixed per theme (not couple-tunable). */
  secondary: string
  /** --simcha-green - vine-leaf color, fixed per theme (not couple-tunable). */
  tertiary: string
  /** First entry is always equal to `accent`. */
  accentSwatches: string[]
  displayFont: string
  edge: CardEdge
  cta: CtaVariant
}

export const GUEST_PAGE_THEMES: GuestPageTheme[] = [
  {
    id: 'classic',
    label: 'עתיק',
    vibe: 'הקלאסיקה של שמחה — נייר, חותם ודיו',
    paper: '#efe6d2',
    paperDark: '#e3d6b8',
    ink: '#241a14',
    inkMuted: '#5a4d3a',
    line: '#c9b98d',
    accent: '#b23a2e',
    secondary: '#8c7038',
    tertiary: '#4f5c3a',
    accentSwatches: ['#b23a2e', '#6b3f2a', '#3d5a73'],
    displayFont: "'Frank Ruhl Libre', serif",
    edge: 'torn',
    cta: 'seal',
  },
  {
    id: 'rosewater',
    label: 'רוזווטר',
    vibe: 'פרחים כבושים וגוונים אבקתיים',
    paper: '#f3e3de',
    paperDark: '#e8d2cb',
    ink: '#402022',
    inkMuted: '#7a5450',
    line: '#d9b8ae',
    accent: '#b56b63',
    secondary: '#ab8b5c',
    tertiary: '#7c8767',
    accentSwatches: ['#b56b63', '#a3789e', '#c9a35b'],
    displayFont: "'David Libre', serif",
    edge: 'torn',
    cta: 'seal',
  },
  {
    id: 'minimal',
    label: 'מינימל לבן',
    vibe: 'גלריה תל אביבית — קו נקי והרבה אוויר',
    paper: '#faf8f4',
    paperDark: '#efe9df',
    ink: '#201f1d',
    inkMuted: '#6b6459',
    line: '#ded6c8',
    accent: '#c1512c',
    secondary: '#a89e8f',
    tertiary: '#5c554a',
    accentSwatches: ['#c1512c', '#1f6f5c', '#2b2b2b'],
    displayFont: "'Suez One', sans-serif",
    edge: 'straight',
    cta: 'rect',
  },
  {
    id: 'orchard',
    label: 'בוסתן קיץ',
    vibe: 'פרדס, אדמה חמה ואור אחר צהריים',
    paper: '#f1e6cf',
    paperDark: '#e6d7b5',
    ink: '#2d2e1a',
    inkMuted: '#5f6144',
    line: '#cdbb87',
    accent: '#b8603a',
    secondary: '#6b7a42',
    tertiary: '#c99a2e',
    accentSwatches: ['#b8603a', '#6b7a42', '#c99a2e'],
    displayFont: "'Secular One', sans-serif",
    edge: 'torn',
    cta: 'seal',
  },
  {
    id: 'jewel',
    label: 'אודם ואבן',
    vibe: 'אבן ירושלים, רימון ואבנים יקרות',
    paper: '#ece2c8',
    paperDark: '#ddd0ac',
    ink: '#2a231c',
    inkMuted: '#5c5140',
    line: '#c9b98a',
    accent: '#7a1f2b',
    secondary: '#b8923f',
    tertiary: '#1f4d3d',
    accentSwatches: ['#7a1f2b', '#1f4d3d', '#b8923f'],
    displayFont: "'Noto Serif Hebrew', serif",
    edge: 'ornate',
    cta: 'seal',
  },
]

const THEMES_BY_ID = new Map(GUEST_PAGE_THEMES.map((t) => [t.id, t]))

export function getGuestPageTheme(id: string | null | undefined): GuestPageTheme {
  return (id && THEMES_BY_ID.get(id as GuestPageThemeId)) || GUEST_PAGE_THEMES[0]
}

/** Inline style to put on the invite card's root so every descendant (incl. shared motif components) reskins. */
export function guestPageThemeVars(theme: GuestPageTheme, accentColor?: string | null): CSSProperties {
  return {
    '--simcha-paper': theme.paper,
    '--simcha-paper-dark': theme.paperDark,
    '--simcha-ink': theme.ink,
    '--simcha-ink-muted': theme.inkMuted,
    '--simcha-line': theme.line,
    '--simcha-red': accentColor || theme.accent,
    '--simcha-gold': theme.secondary,
    '--simcha-green': theme.tertiary,
    '--simcha-display-font': theme.displayFont,
  } as CSSProperties
}
