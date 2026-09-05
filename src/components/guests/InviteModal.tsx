import { useState } from 'react'
import { guestsApi } from '../../api/guests'
import type { InviteSendResult } from '../../types/guests'
import './import-modal.css'

type InviteModalMode = 'invite' | 'remind' | 'day-before'

interface InviteModalProps {
  weddingId: string
  recipientCount: number
  /** Scopes the send to a couple's own selection instead of every eligible
   * guest - omitted for the plain "send to everyone" bulk actions. */
  guestIds?: string[]
  mode?: InviteModalMode
  onClose: () => void
}

const COPY: Record<InviteModalMode, { title: string; hint: (n: number) => string; confirm: (n: number) => string }> = {
  invite: {
    title: 'שליחת הזמנות בוואטסאפ',
    hint: (n) =>
      `הודעה עם קישור לאישור הגעה תישלח ל-${n} אורחים עם מספר טלפון. פעולה זו כרוכה בעלות שליחה בפועל - ודאו שרשימת האורחים מוכנה לפני האישור.`,
    confirm: (n) => `שלחו ל-${n} אורחים`,
  },
  remind: {
    title: 'שליחת תזכורת בוואטסאפ',
    hint: (n) =>
      `תזכורת לאישור הגעה תישלח ל-${n} אורחים שטרם אישרו הגעה ויש להם מספר טלפון. פעולה זו כרוכה בעלות שליחה בפועל.`,
    confirm: (n) => `שלחו תזכורת ל-${n} אורחים`,
  },
  'day-before': {
    title: 'תזכורת לפני החתונה',
    hint: (n) =>
      `הודעה עם שעת הטקס, קוד לבוש וחניה תישלח ל-${n} אורחים שאישרו הגעה ויש להם מספר טלפון. מתאים לשלוח יום-יומיים לפני החתונה.`,
    confirm: (n) => `שלחו ל-${n} אורחים`,
  },
}

// WhatsApp caps a business number at 250 unique numbers messaged per
// rolling 24h - this is just a client-side heads-up so a couple sending a
// huge list isn't surprised by the backend's hard block; the backend is the
// real source of truth since it also accounts for numbers already messaged
// today by other sends.
const WHATSAPP_ROLLING_LIMIT = 250

// WhatsApp sends cost real money per guest - this is a confirm-then-send
// flow, never a single-click fire, so a couple can't blast 200+ guests by
// accident.
export function InviteModal({
  weddingId,
  recipientCount,
  guestIds,
  mode = 'invite',
  onClose,
}: InviteModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InviteSendResult | null>(null)
  const copy = COPY[mode]

  const handleConfirm = async () => {
    setBusy(true)
    setError(null)
    try {
      const sendResult =
        mode === 'remind'
          ? await guestsApi.sendReminders(weddingId, guestIds)
          : mode === 'day-before'
            ? await guestsApi.sendDayBeforeReminders(weddingId, guestIds)
            : await guestsApi.sendInvites(weddingId, guestIds)
      setResult(sendResult)
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="import-modal-overlay" onClick={onClose}>
      <div className="import-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{copy.title}</h2>

        {!result && <p className="import-modal__hint">{copy.hint(recipientCount)}</p>}

        {!result && recipientCount > WHATSAPP_ROLLING_LIMIT && (
          <p className="import-modal__error">
            וואטסאפ מגביל שליחה ל-{WHATSAPP_ROLLING_LIMIT} מספרים שונים בכל 24 שעות, ורשימה זו
            חורגת מהמגבלה - השליחה תיחסם. שלחו לחלקים מהרשימה בכל פעם.
          </p>
        )}

        {error && <p className="import-modal__error">{error}</p>}

        {result && (
          <div className="import-modal__result">
            <p>
              נשלחו {result.sentCount} בהצלחה
              {result.failedCount > 0 && ` · נכשלו ${result.failedCount}`}
              {result.skippedNoPhoneCount > 0 && ` · דולגו ${result.skippedNoPhoneCount} ללא מספר טלפון`}
            </p>
            {result.errors.length > 0 && (
              <ul className="import-modal__preview-list">
                {result.errors.map((e) => (
                  <li key={e.guestId} className="import-modal__row--invalid">
                    {e.name}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="import-modal__actions">
          {result ? (
            <button className="dash-btn" onClick={onClose}>
              סגירה
            </button>
          ) : (
            <>
              <button
                className="dash-btn dash-btn--primary"
                onClick={handleConfirm}
                disabled={busy || recipientCount === 0}
              >
                {busy && <span className="dash-guest-spinner" />}
                {copy.confirm(recipientCount)}
              </button>
              <button className="dash-btn" onClick={onClose} disabled={busy}>
                ביטול
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
