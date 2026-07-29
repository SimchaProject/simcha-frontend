import { normalizePhone } from './phone'

// wa.me requires international format with no leading zero or '+'.
function toInternationalPhone(localPhone: string): string {
  const normalized = normalizePhone(localPhone)
  return `972${normalized.replace(/^0/, '')}`
}

export function buildWaLink(localPhone: string, message: string): string {
  return `https://wa.me/${toInternationalPhone(localPhone)}?text=${encodeURIComponent(message)}`
}
