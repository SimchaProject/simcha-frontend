import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { rsvpApi } from '../api/rsvp'
import { weddingApi } from '../api/wedding'
import type { PublicWeddingInfo } from '../types/wedding'
import { formatHebrewDate } from '../lib/hebrewDate'
import { SeedDots } from '../components/motifs/SeedDots'
import { WaxSealButton } from '../components/motifs/WaxSealButton'
import { VineDivider } from '../components/motifs/VineDivider'
import { Countdown } from '../components/motifs/Countdown'
import { ScheduleList } from '../components/motifs/ScheduleList'
import { ArrivalSection } from '../components/motifs/ArrivalSection'
import { GiftSection } from '../components/motifs/GiftSection'
import { normalizePhone, isValidIsraeliMobile } from '../utils/phone'
import './InvitePage.css'

const MAX_PARTY_SIZE = 6

interface FieldErrors {
  name?: string
  phone?: string
  attending?: string
}

function validate(name: string, phone: string, attending: boolean | null): FieldErrors {
  const errors: FieldErrors = {}
  if (name.trim().length < 2) {
    errors.name = 'נא להזין שם מלא'
  }
  if (!isValidIsraeliMobile(phone)) {
    errors.phone = 'מספר טלפון לא תקין'
  }
  if (attending === null) {
    errors.attending = 'נא לבחור האם תגיעו'
  }
  return errors
}

export function InvitePage() {
  const { weddingSlug } = useParams<{ weddingSlug: string }>()
  const [wedding, setWedding] = useState<PublicWeddingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [partySize, setPartySize] = useState(1)
  const [attending, setAttending] = useState<boolean | null>(null)
  const [dietaryNotes, setDietaryNotes] = useState('')
  const [needsTransport, setNeedsTransport] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [previousStatus, setPreviousStatus] = useState<'ATTENDING' | 'DECLINED' | null>(null)

  useEffect(() => {
    if (!weddingSlug) return
    let cancelled = false
    weddingApi
      .getBySlug(weddingSlug)
      .then((result) => {
        if (cancelled) return
        setWedding(result)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setNotFound(true)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [weddingSlug])

  if (!weddingSlug) return <p className="invite-page__error">ההזמנה לא נמצאה.</p>

  if (loading) {
    return (
      <div className="invite-page">
        <p className="invite-page__error">טוען...</p>
      </div>
    )
  }

  if (notFound || !wedding) {
    return (
      <div className="invite-page">
        <p className="invite-page__error">ההזמנה לא נמצאה.</p>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fieldErrors = validate(name, phone, attending)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await rsvpApi.submit(weddingSlug, {
        name: name.trim(),
        phone: normalizePhone(phone),
        partySize,
        attending: attending === true,
        dietaryNotes: attending === true ? dietaryNotes.trim() || undefined : undefined,
        needsTransport: attending === true ? needsTransport : undefined,
      })
      setPreviousStatus(result.previousStatus)
      setSubmitted(true)
    } catch {
      setSubmitError('משהו השתבש, נסו שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="invite-page">
      <div className="invite-card">
        <p className="invite-eyebrow">בשמחה ובאהבה</p>
        <p className="invite-names">
          {wedding.coupleNameA} <span className="invite-amp">&amp;</span> {wedding.coupleNameB}
        </p>
        <p className="invite-subline">
          {formatHebrewDate(wedding.date)} &nbsp;·&nbsp; {wedding.venue}
          {wedding.guestPageConfig.ceremonyTime && (
            <>
              {' '}
              &nbsp;·&nbsp; שעה {wedding.guestPageConfig.ceremonyTime}
            </>
          )}
        </p>
        {wedding.guestPageConfig.welcomeMessage && (
          <p className="invite-welcome-message">{wedding.guestPageConfig.welcomeMessage}</p>
        )}
        {wedding.guestPageConfig.dressCode && (
          <p className="invite-subline">קוד לבוש: {wedding.guestPageConfig.dressCode}</p>
        )}

        <Countdown targetDate={wedding.date} />
        <ScheduleList entries={wedding.guestPageConfig.schedule} />
        <ArrivalSection
          mapUrl={wedding.guestPageConfig.mapUrl}
          parkingInfo={wedding.guestPageConfig.parkingInfo}
        />
        <GiftSection
          payboxLink={wedding.guestPageConfig.payboxLink}
          bankTransferDetails={wedding.guestPageConfig.bankTransferDetails}
        />

        <VineDivider />

        {submitted ? (
          <div className="invite-success">
            <p className="invite-section-title">
              {attending ? 'תודה שאישרתם!' : 'תודה על העדכון'}
            </p>
            <p className="invite-section-sub">
              {attending ? 'שומרים לכם מקום, מתרגשים לראותכם' : 'חבל שלא תוכלו להגיע, נתגעגע'}
            </p>
            {previousStatus && (
              <p className="invite-section-sub invite-section-sub--note">
                שימו לב: כבר עדכנתם בעבר ש
                {previousStatus === 'ATTENDING' ? 'תגיעו' : 'לא תוכלו להגיע'}. התשובה שלכם עודכנה בהתאם לבחירה
                הנוכחית.
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="invite-section-title">אישור הגעה</p>
            <p className="invite-section-sub">מלאו כאן ותשובתכם תעודכן ישירות לזוג</p>

            <form className="invite-form" onSubmit={handleSubmit} noValidate>
              <div className={`invite-field${errors.name ? ' invite-field--error' : ''}`}>
                <label htmlFor="rsvp-name">שם מלא</label>
                <input
                  id="rsvp-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  placeholder="לדוגמה: נועה כהן"
                  autoComplete="name"
                />
                {errors.name && <p className="invite-field__error">{errors.name}</p>}
              </div>

              <div className={`invite-field${errors.phone ? ' invite-field--error' : ''}`}>
                <label htmlFor="rsvp-phone">טלפון נייד</label>
                <input
                  id="rsvp-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
                  }}
                  placeholder="050-1234567"
                  autoComplete="tel"
                />
                {errors.phone && <p className="invite-field__error">{errors.phone}</p>}
              </div>

              <div className="invite-field">
                <label>האם תגיעו?</label>
                <div className="invite-attend-toggle" role="group" aria-label="האם תגיעו">
                  <button
                    type="button"
                    className={`invite-attend-option${attending === true ? ' invite-attend-option--selected' : ''}`}
                    aria-pressed={attending === true}
                    onClick={() => {
                      setAttending(true)
                      if (errors.attending) setErrors((prev) => ({ ...prev, attending: undefined }))
                    }}
                  >
                    מגיעים בשמחה
                  </button>
                  <button
                    type="button"
                    className={`invite-attend-option${attending === false ? ' invite-attend-option--selected' : ''}`}
                    aria-pressed={attending === false}
                    onClick={() => {
                      setAttending(false)
                      if (errors.attending) setErrors((prev) => ({ ...prev, attending: undefined }))
                    }}
                  >
                    לא נוכל להגיע
                  </button>
                </div>
                {errors.attending && <p className="invite-field__error">{errors.attending}</p>}
              </div>

              {attending === true && (
                <>
                  <div className="invite-field">
                    <label>כמה מגיעים</label>
                    <div className="invite-party-size-row">
                      <SeedDots value={partySize} max={MAX_PARTY_SIZE} onChange={setPartySize} label="כמה מגיעים" />
                      <input
                        type="number"
                        min={1}
                        className="invite-party-size-input"
                        value={partySize}
                        onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
                        aria-label="כמה מגיעים (מספר)"
                      />
                    </div>
                  </div>

                  <div className="invite-field">
                    <label htmlFor="rsvp-dietary">הערות תזונה (אופציונלי)</label>
                    <textarea
                      id="rsvp-dietary"
                      className="invite-dietary"
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      placeholder="צמחוני, טבעוני, אלרגיות..."
                      rows={2}
                    />
                  </div>

                  <div className="invite-field invite-field--checkbox">
                    <label className="invite-checkbox-label">
                      <input
                        type="checkbox"
                        checked={needsTransport}
                        onChange={(e) => setNeedsTransport(e.target.checked)}
                      />
                      צריך/ה הסעה מאורגנת
                    </label>
                  </div>
                </>
              )}

              {submitError && <p className="invite-page__error">{submitError}</p>}

              <div className="invite-seal-wrap">
                <WaxSealButton type="submit" loading={submitting}>
                  אישור
                </WaxSealButton>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
