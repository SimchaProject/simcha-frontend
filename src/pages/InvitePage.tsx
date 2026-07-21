import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { rsvpApi } from '../api/rsvp'
import { SeedDots } from '../components/motifs/SeedDots'
import { WaxSealButton } from '../components/motifs/WaxSealButton'
import { VineDivider } from '../components/motifs/VineDivider'
import './InvitePage.css'

const MAX_PARTY_SIZE = 6

// Placeholder until a wedding-info endpoint exists — couple/date/venue should
// come from the backend per weddingSlug rather than being hardcoded here.
const DEMO_WEDDING = {
  brideName: 'רותם',
  groomName: 'עידן',
  dateLabel: 'יום שני, 21 בספטמבר 2026',
  venueLabel: 'גן האירוס, זכרון יעקב',
}

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
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [partySize, setPartySize] = useState(1)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)

  if (!weddingSlug) return <p className="invite-page__error">ההזמנה לא נמצאה.</p>

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
          {DEMO_WEDDING.brideName} <span className="invite-amp">&amp;</span> {DEMO_WEDDING.groomName}
        </p>
        <p className="invite-subline">
          {DEMO_WEDDING.dateLabel} &nbsp;·&nbsp; {DEMO_WEDDING.venueLabel}
        </p>

        <VineDivider />

        {whatsappUrl ? (
          <div className="invite-success">
            <p className="invite-section-title">תודה שאישרתם!</p>
            <p className="invite-section-sub">שומרים לכם מקום, מתרגשים לראותכם</p>
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
