import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { InviteCardPreview } from '../components/motifs/InviteCardPreview'
import { getGuestPageTheme } from '../theme/guestPageThemes'
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
  const [openToMingle, setOpenToMingle] = useState(false)
  const [mingleAge, setMingleAge] = useState('')
  const [mingleBio, setMingleBio] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [previousStatus, setPreviousStatus] = useState<'ATTENDING' | 'DECLINED' | null>(null)
  const [mingleToken, setMingleToken] = useState<string | null>(null)

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
        openToMingle: attending === true ? openToMingle : undefined,
        mingleAge: attending === true && openToMingle && mingleAge ? Number(mingleAge) : undefined,
        mingleBio:
          attending === true && openToMingle ? mingleBio.trim() || undefined : undefined,
      })
      setPreviousStatus(result.previousStatus)
      setMingleToken(result.mingleToken)
      setSubmitted(true)
    } catch {
      setSubmitError('משהו השתבש, נסו שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  const theme = getGuestPageTheme(wedding.guestPageConfig.theme)

  return (
    <div className="invite-page">
      <InviteCardPreview
        themeId={theme.id}
        accentColor={wedding.guestPageConfig.accentColor}
        coupleNameA={wedding.coupleNameA}
        coupleNameB={wedding.coupleNameB}
        dateLabel={formatHebrewDate(wedding.date)}
        venue={wedding.venue}
        ceremonyTime={wedding.guestPageConfig.ceremonyTime}
        welcomeMessage={wedding.guestPageConfig.welcomeMessage}
        dressCode={wedding.guestPageConfig.dressCode}
        heroPhotoUrl={wedding.guestPageConfig.heroPhotoUrl}
      >
        <Countdown targetDate={wedding.date} />

        <VineDivider />

        {/* The RSVP form comes before the day-of details on purpose: answering
            is the one thing this page asks of a guest, and it used to sit
            below the schedule, arrival and gift sections. */}
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

                  {wedding.guestPageConfig.mingleEnabled && (
                    <div className="invite-mingle">
                      <label className="invite-checkbox-label">
                        <input
                          type="checkbox"
                          checked={openToMingle}
                          onChange={(e) => setOpenToMingle(e.target.checked)}
                        />
                        מגיע/ה לבד ופתוח/ה להכיר אנשים חדשים
                      </label>
                      <p className="invite-mingle__note">
                        לגמרי אופציונלי. אם תסמנו, תקבלו קישור לפינת הרווקים של האירוע ותופיעו בה
                        לשאר מי שסימנו — שם פרטי בלבד, בלי טלפון.
                      </p>

                      {openToMingle && (
                        <div className="invite-mingle__fields">
                          <div className="invite-field">
                            <label htmlFor="rsvp-mingle-age">גיל (אופציונלי)</label>
                            <input
                              id="rsvp-mingle-age"
                              type="number"
                              min={18}
                              max={120}
                              value={mingleAge}
                              onChange={(e) => setMingleAge(e.target.value)}
                              placeholder="29"
                            />
                          </div>
                          <div className="invite-field">
                            <label htmlFor="rsvp-mingle-bio">משהו קטן עליכם (אופציונלי)</label>
                            <textarea
                              id="rsvp-mingle-bio"
                              className="invite-dietary"
                              rows={2}
                              maxLength={280}
                              value={mingleBio}
                              onChange={(e) => setMingleBio(e.target.value)}
                              placeholder="חברה של הכלה מהאוניברסיטה, אוהבת לטייל ולבשל"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {submitError && <p className="invite-page__error">{submitError}</p>}

              <div className="invite-seal-wrap">
                <WaxSealButton type="submit" loading={submitting} variant={theme.cta}>
                  אישור
                </WaxSealButton>
              </div>
            </form>
          </>
        )}

        {/* One way in, and it belongs to the RSVP block rather than to the
            day-of details: joining the corner happens on this form, so the
            way back to it sits with the form. A guest who just opted in goes
            straight through on their token; everyone else lands on the phone
            gate. */}
        {wedding.guestPageConfig.mingleEnabled && (
          <Link
            to={
              mingleToken
                ? `/w/${weddingSlug}/mingle/${mingleToken}`
                : `/w/${weddingSlug}/singles`
            }
            className="invite-nav-card"
          >
            <span className="invite-nav-card__icon" aria-hidden="true">
              ♡
            </span>
            <span className="invite-nav-card__text">
              <span className="invite-nav-card__title">רווקים ורווקות</span>
              <span className="invite-nav-card__sub">
                {mingleToken
                  ? 'הצטרפתם — אפשר להציץ מי עוד שם'
                  : 'מי מגיע/ה לבד, ופתוח/ה להכיר'}
              </span>
            </span>
            {/* dir=ltr so the bidi algorithm doesn't mirror the glyph back to
                pointing the way we came from. */}
            <span className="invite-nav-card__chevron" dir="ltr" aria-hidden="true">
              ‹
            </span>
          </Link>
        )}

        <VineDivider />

        <ScheduleList entries={wedding.guestPageConfig.schedule} />
        <ArrivalSection
          mapUrl={wedding.guestPageConfig.mapUrl}
          parkingInfo={wedding.guestPageConfig.parkingInfo}
        />
        <GiftSection
          payboxLink={wedding.guestPageConfig.payboxLink}
          bankTransferDetails={wedding.guestPageConfig.bankTransferDetails}
        />
      </InviteCardPreview>
    </div>
  )
}
