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

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
