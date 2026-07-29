import type { Guest } from '../../types/guests'
import { buildWaLink } from '../../utils/whatsapp'

interface BulkWhatsAppBarProps {
  guests: Guest[]
  onClear: () => void
  coupleNameA: string
  coupleNameB: string
  inviteUrl: string
}

// Browsers block multiple window.open() calls fired in a loop without a
// user gesture per call, so this renders one link per guest for the couple
// to click through individually rather than trying to auto-open every tab.
export function BulkWhatsAppBar({
  guests,
  onClear,
  coupleNameA,
  coupleNameB,
  inviteUrl,
}: BulkWhatsAppBarProps) {
  const withPhone = guests.filter((g): g is Guest & { phone: string } => Boolean(g.phone))
  const withoutPhoneCount = guests.length - withPhone.length

  return (
    <div className="bulk-wa-bar">
      <div className="bulk-wa-bar__summary">
        <span>{guests.length} אורחים נבחרו</span>
        {withoutPhoneCount > 0 && (
          <span className="bulk-wa-bar__note">({withoutPhoneCount} ללא מספר טלפון)</span>
        )}
        <button className="btn btn--ghost" onClick={onClear}>
          ניקוי בחירה
        </button>
      </div>
      <div className="bulk-wa-bar__links">
        {withPhone.map((guest) => (
          <a
            key={guest.id}
            className="btn btn--ghost"
            href={buildWaLink(
              guest.phone,
              `היי ${guest.name}! מוזמנים לחתונה של ${coupleNameA} ו${coupleNameB} 🎉 לאישור הגעה: ${inviteUrl}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            {guest.name}
          </a>
        ))}
      </div>
    </div>
  )
}
