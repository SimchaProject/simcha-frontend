import { useState } from 'react'
import { guestsApi } from '../../api/guests'
import type { InviteSendResult } from '../../types/guests'
import './import-modal.css'

interface InviteModalProps {
  weddingId: string
  recipientCount: number
  onClose: () => void
}

// WhatsApp sends cost real money per guest - this is a confirm-then-send
// flow, never a single-click fire, so a couple can't blast 200+ guests by
// accident.
export function InviteModal({ weddingId, recipientCount, onClose }: InviteModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<InviteSendResult | null>(null)

  const handleConfirm = async () => {
    setBusy(true)
    setError(null)
    try {
      const sendResult = await guestsApi.sendInvites(weddingId)
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
        <h2>שליחת הזמנות ב-WhatsApp</h2>

        {!result && (
          <p className="import-modal__hint">
            הודעה עם קישור לאישור הגעה תישלח ל-{recipientCount} אורחים עם מספר טלפון. פעולה זו
            כרוכה בעלות שליחה בפועל - ודאו שרשימת האורחים מוכנה לפני האישור.
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
            <button className="dash-guest-btn" onClick={onClose}>
              סגירה
            </button>
          ) : (
            <>
              <button
                className="dash-guest-btn"
                onClick={handleConfirm}
                disabled={busy || recipientCount === 0}
              >
                {busy && <span className="dash-guest-spinner" />}
                שלחו ל-{recipientCount} אורחים
              </button>
              <button className="dash-guest-btn" onClick={onClose} disabled={busy}>
                ביטול
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
