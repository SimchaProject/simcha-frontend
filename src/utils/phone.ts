export function normalizePhone(raw: string): string {
  return raw.replace(/[\s-]/g, '')
}

export function isValidIsraeliMobile(phone: string): boolean {
  return /^05\d{8}$/.test(normalizePhone(phone))
}
