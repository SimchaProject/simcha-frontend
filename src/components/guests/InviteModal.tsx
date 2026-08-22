import { useMemo, useState } from 'react'
import type { Guest } from '../../types/guests'
import { buildInviteMessage, buildReminderMessage, buildWaMeLink } from '../../utils/waLink'
import './import-modal.css'

interface InviteModalProps {
  guests: Guest[]
  coupleNameA: string
  coupleNameB: string
  weddingSlug: string
  onClose: () => void
}

type Mode = 'invite' | 'reminder'

// WhatsApp, via wa.me links built here in the browser - no Business API, no
// per-message cost, and nothing to configure. The trade-off is that WhatsApp
// can't be driven from a server: each message opens in the couple's own
// WhatsApp with the text prefilled, and they press send. So this is a
// work-through-the-list screen rather than a fire-once button, and it
// remembers who's been done.
export function InviteModal({
  guests,
  coupleNameA,
  coupleNameB,
  weddingSlug,
  onClose,
}: InviteModalProps) {
  const [mode, setMode] = useState<Mode>('invite')
  const [sent, setSent] = useState<Set<string>>(new Set())

  const inviteUrl = `${window.location.origin}/w/${weddingSlug}`

  const recipients = useMemo(() => {
    const withPhone = guests.filter((g) => g.phone)
    // Chasing non-responders is the other half of this job, and the couple
    // shouldn't have to filter the guest list by hand to do it.
    return mode === 'reminder'
      ? withPhone.filter((g) => g.rsvpStatus === 'PENDING')
      : withPhone
  }, [guests, mode])

  const withoutPhone = guests.filter((g) => !g.phone).length

  const messageFor = (guest: Guest) =>
    mode === 'invite'
      ? buildInviteMessage(guest.name, coupleNameA, coupleNameB, inviteUrl)
      : buildReminderMessage(guest.name, coupleNameA, coupleNameB, inviteUrl)

  const openFor = (guest: Guest) => {
    window.open(buildWaMeLink(guest.phone!, messageFor(guest)), '_blank', 'noopener')
    setSent((prev) => new Set(prev).add(guest.id))
  }

  const remaining = recipients.filter((g) => !sent.has(g.id))

  return (
    <div className="import-modal-overlay" onClick={onClose}>
      <div className="import-modal wa-modal" onClick={(e) => e.stopPropagation()}>
        <h2>שליחת הזמנות בוואטסאפ</h2>

        <div className="wa-modal__tabs">
          <button
            type="button"
            className={mode === 'invite' ? 'is-active' : ''}
            onClick={() => setMode('invite')}
          >
            הזמנה
          </button>
          <button
            type="button"
            className={mode === 'reminder' ? 'is-active' : ''}
            onClick={() => setMode('reminder')}
          >
            תזכורת למי שלא ענה
          </button>
        </div>

        <p className="import-modal__hint">
          כל לחיצה פותחת וואטסאפ עם ההודעה מוכנה — אתם רק לוחצים שלח. ההודעות נשלחות מהמספר שלכם,
          בלי עלות ובלי הגדרות.
          {withoutPhone > 0 && ` ${withoutPhone} אורחים ללא טלפון לא מופיעים כאן.`}
        </p>

        <p className="wa-modal__progress">
          {sent.size} מתוך {recipients.length} נפתחו
          {remaining.length === 0 && recipients.length > 0 && ' · סיימתם 🎉'}
        </p>

        {recipients.length === 0 ? (
          <p className="import-modal__hint">
            {mode === 'reminder'
              ? 'כל מי שיש לו טלפון כבר ענה. אין למי לשלוח תזכורת.'
              : 'אין אורחים עם מספר טלפון ברשימה.'}
          </p>
        ) : (
          <ul className="wa-modal__list">
            {recipients.map((guest) => (
              <li key={guest.id} className={sent.has(guest.id) ? 'is-sent' : ''}>
                <span className="wa-modal__name">{guest.name}</span>
                <span className="wa-modal__phone" dir="ltr">
                  {guest.phone}
                </span>
                <button type="button" onClick={() => openFor(guest)}>
                  {sent.has(guest.id) ? 'שלחו שוב' : 'פתחו בוואטסאפ'}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="import-modal__actions">
          <button type="button" className="dash-btn" onClick={onClose}>
            סגירה
          </button>
        </div>
      </div>
    </div>
  )
}
