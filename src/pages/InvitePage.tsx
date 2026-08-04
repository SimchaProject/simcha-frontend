import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { rsvpApi } from '../api/rsvp'
import { weddingApi } from '../api/wedding'
import type { PublicWedding } from '../types/wedding'
import { formatHebrewDate } from '../lib/hebrewDate'
import { SeedDots } from '../components/motifs/SeedDots'
import { WaxSealButton } from '../components/motifs/WaxSealButton'
import { VineDivider } from '../components/motifs/VineDivider'
import './InvitePage.css'

const MAX_PARTY_SIZE = 6

interface FieldErrors {
  name?: string
  phone?: string
}

function normalizePhone(raw: string) {
  return raw.replace(/[\s-]/g, '')
}

function validate(name: string, phone: string): FieldErrors {
  const errors: FieldErrors = {}
  if (name.trim().length < 2) {
    errors.name = 'נא להזין שם מלא'
  }
  if (!/^05\d{8}$/.test(normalizePhone(phone))) {
    errors.phone = 'מספר טלפון לא תקין'
  }
  return errors
}

export function InvitePage() {
  const { weddingSlug } = useParams<{ weddingSlug: string }>()
  const [wedding, setWedding] = useState<PublicWedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [partySize, setPartySize] = useState(1)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)

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
        if (!cancelled) {
          setLoadError(true)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [weddingSlug])

  if (!weddingSlug) return <p className="invite-page__error">ההזמנה לא נמצאה.</p>
  if (loading) return <div className="invite-page" />
  if (loadError || !wedding) {
    return (
      <div className="invite-page">
        <p className="invite-page__error">ההזמנה לא נמצאה.</p>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fieldErrors = validate(name, phone)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await rsvpApi.submit(weddingSlug, {
        name: name.trim(),
        phone: normalizePhone(phone),
        partySize,
      })
      setWhatsappUrl(result.whatsappUrl)
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
          {wedding.guestPageConfig?.ceremonyTime && (
            <>
              {' '}
              &nbsp;·&nbsp; שעה {wedding.guestPageConfig.ceremonyTime}
            </>
          )}
        </p>
        {wedding.guestPageConfig?.welcomeMessage && (
          <p className="invite-welcome">{wedding.guestPageConfig.welcomeMessage}</p>
        )}
        {wedding.guestPageConfig?.dressCode && (
          <p className="invite-subline">קוד לבוש: {wedding.guestPageConfig.dressCode}</p>
        )}

        <VineDivider />

        {submitted ? (
          <div className="invite-success">
            <p className="invite-section-title">תודה שאישרתם!</p>
            <p className="invite-section-sub">שומרים לכם מקום, מתרגשים לראותכם</p>
            {whatsappUrl && (
              <>
                <div className="invite-seal-wrap">
                  <a
                    className="wax-seal"
                    style={{ transform: 'rotate(4deg)' }}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    וואטסאפ
                  </a>
                </div>
                <p className="invite-wa-note">לחצו לקבלת אישור בוואטסאפ</p>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="invite-section-title">אישור הגעה</p>
            <p className="invite-section-sub">מלאו כאן ותקבלו אישור בוואטסאפ</p>

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
                <label>כמה מגיעים</label>
                <SeedDots value={partySize} max={MAX_PARTY_SIZE} onChange={setPartySize} label="כמה מגיעים" />
              </div>

              {submitError && <p className="invite-page__error">{submitError}</p>}

              <div className="invite-seal-wrap">
                <WaxSealButton type="submit" loading={submitting}>
                  אישור
                </WaxSealButton>
              </div>
              <p className="invite-wa-note">אישור יישלח אליכם בוואטסאפ</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
