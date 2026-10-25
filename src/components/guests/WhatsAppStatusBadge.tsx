import type { GuestWhatsAppStatus, WhatsAppDeliveryStatus } from '../../types/guests'

const LABELS: Record<WhatsAppDeliveryStatus, string> = {
  accepted: 'ממתין לוואטסאפ',
  sent: '✓ נשלח',
  delivered: '✓✓ התקבל',
  read: '✓✓ נקרא',
  failed: '⚠️ לא נמסר',
}

// Meta's error codes a couple is actually likely to hit, in words they can
// act on. Anything else falls back to Meta's own title.
// https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
const FAILURE_REASONS: Record<number, string> = {
  131049:
    'וואטסאפ עצר את ההודעה כי האורח קיבל לאחרונה יותר מדי הודעות שיווקיות. אל תשלחו שוב לפני שעברו 24 שעות - כל ניסיון נוסף רק מאריך את החסימה.',
  131050: 'האורח ביקש מוואטסאפ לא לקבל הודעות שיווקיות מהעסק.',
  131026:
    'לא ניתן למסור: ייתכן שהמספר לא רשום בוואטסאפ, שהאורח חסם את המספר שלנו, או שגרסת האפליקציה שלו ישנה.',
  131053: 'וואטסאפ לא הצליח לעבד את התמונה. נסו להעלות תמונה אחרת.',
  130472: 'המספר נכלל בניסוי של וואטסאפ ולא קיבל את ההודעה.',
}

function describe(status: GuestWhatsAppStatus): string {
  const sentAt = new Date(status.sentAt).toLocaleString('he-IL', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
  if (status.status === 'failed') {
    const reason =
      (status.errorCode !== null && FAILURE_REASONS[status.errorCode]) ||
      `וואטסאפ דחה את ההודעה (${status.errorCode ?? ''} ${status.errorTitle ?? ''})`.trim()
    return `${reason}\nנשלח ב-${sentAt}`
  }
  if (status.status === 'accepted') {
    return `וואטסאפ קיבל את הבקשה ב-${sentAt} ועדיין לא דיווח אם ההודעה נשלחה.`
  }
  return `ההודעה האחרונה נשלחה ב-${sentAt}`
}

// What happened to the guest's latest WhatsApp message, under their phone
// number - "sent" in the send dialog only means Meta accepted the request.
export function WhatsAppStatusBadge({ status }: { status: GuestWhatsAppStatus | undefined }) {
  if (!status) return null
  return (
    <span className={`dash-wa-status dash-wa-status--${status.status}`} title={describe(status)}>
      {LABELS[status.status]}
    </span>
  )
}
