import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { mingleApi } from '../api/mingle'
import { weddingApi } from '../api/wedding'
import type { PublicWeddingInfo } from '../types/wedding'
import { WaxSealButton } from '../components/motifs/WaxSealButton'
import { isValidIsraeliMobile, normalizePhone } from '../utils/phone'
import './InvitePage.css'
import './MinglePage.css'

// The way back in for a guest who joined the singles corner and no longer has
// the personal link from their RSVP confirmation. The phone number they gave
// the couple is the thing they'll always still have.
export function SinglesEntryPage() {
  const { weddingSlug } = useParams<{ weddingSlug: string }>()
  const navigate = useNavigate()
  const [wedding, setWedding] = useState<PublicWeddingInfo | null>(null)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!weddingSlug) return
    weddingApi.getBySlug(weddingSlug).then(setWedding).catch(() => undefined)
  }, [weddingSlug])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!weddingSlug) return
    if (!isValidIsraeliMobile(phone)) {
      setError('מספר טלפון לא תקין')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { token } = await mingleApi.access(weddingSlug, normalizePhone(phone))
      navigate(`/w/${weddingSlug}/mingle/${token}`, { replace: true })
    } catch {
      // The API can't tell us which of "wrong number", "not on the list" or
      // "didn't join" it was - by design - so neither can this.
      setError('לא מצאנו את המספר הזה ברשימה')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="invite-page">
      <div className="invite-card mingle-entry">
        <p className="mingle-heart" aria-hidden="true">
          ♡
        </p>
        <p className="invite-eyebrow">רווקים ורווקות</p>
        <p className="invite-names mingle-entry__headline">
          אולי דווקא כאן
          <br />
          תפגשו מישהו
        </p>
        {wedding && (
          <p className="invite-section-sub">
            בחתונה של {wedding.coupleNameA} ו{wedding.coupleNameB}
          </p>
        )}

        <form className="invite-form mingle-entry__form" onSubmit={handleSubmit} noValidate>
          <div className={`invite-field${error ? ' invite-field--error' : ''}`}>
            <label htmlFor="mingle-phone">הטלפון שמסרתם באישור ההגעה</label>
            <input
              id="mingle-phone"
              type="tel"
              autoComplete="tel"
              placeholder="050-1234567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (error) setError(null)
              }}
            />
            {error && <p className="invite-field__error">{error}</p>}
          </div>

          <div className="invite-seal-wrap">
            <WaxSealButton type="submit" loading={submitting}>
              כניסה
            </WaxSealButton>
          </div>
        </form>

        <p className="invite-section-sub invite-section-sub--note mingle-entry__note">
          עוד לא הצטרפתם? הפינה נפתחת רק למי שסימן/ה בטופס אישור ההגעה שהוא מגיע/ה לבד ופתוח/ה
          להכיר.{' '}
          {weddingSlug && <Link to={`/w/${weddingSlug}`}>לטופס אישור ההגעה</Link>}
        </p>
      </div>
    </div>
  )
}
