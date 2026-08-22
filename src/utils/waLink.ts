// wa.me wants international format: digits only, no '+', no leading zero.
// Guests are typed in by hand and imported from spreadsheets, so this takes
// whatever separators came with the number rather than assuming the stored
// canonical form.
export function toInternationalPhone(localPhone: string): string {
  const digits = localPhone.replace(/\D/g, '')
  if (digits.startsWith('972')) return digits
  return `972${digits.replace(/^0/, '')}`
}

export function buildWaMeLink(localPhone: string, message: string): string {
  return `https://wa.me/${toInternationalPhone(localPhone)}?text=${encodeURIComponent(message)}`
}

export function buildInviteMessage(
  guestName: string,
  coupleNameA: string,
  coupleNameB: string,
  inviteUrl: string,
): string {
  // Plain text only, no emoji. A ring emoji here came out as a replacement
  // character on a real send - it survives our encoding fine, but not every
  // step between wa.me and the recipient's WhatsApp, and a broken glyph in
  // the couple's own invitation isn't worth the decoration.
  return `היי ${guestName}! מוזמנים לחתונה של ${coupleNameA} ו${coupleNameB}.\nכל הפרטים ואישור הגעה כאן: ${inviteUrl}`
}

export function buildReminderMessage(
  guestName: string,
  coupleNameA: string,
  coupleNameB: string,
  inviteUrl: string,
): string {
  return `היי ${guestName}, עדיין לא קיבלנו מכם אישור הגעה לחתונה של ${coupleNameA} ו${coupleNameB}. נשמח שתאשרו כאן: ${inviteUrl}`
}
