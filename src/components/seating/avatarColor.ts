const PALETTE = [
  '#B76E79', '#7A9E7E', '#C9A227', '#6C8EBF', '#A15C9E', '#D08770', '#4F9D9D', '#B0559A',
]

export function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

const FAMILY_PREFIXES = new Set(['משפחת', "משפ'", 'משפ׳'])

/** Short label that fits on a seat: the first name, or the family name for "משפחת X" invitations. */
export function seatLabel(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length > 1 && FAMILY_PREFIXES.has(parts[0])) return parts[1]
  return parts[0] ?? ''
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
