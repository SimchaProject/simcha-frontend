import { useEffect, useState } from 'react'
import { useDashboard } from './dashboard-context'
import { weddingApi } from '../../api/wedding'
import { DatePicker } from '../../components/ui/DatePicker'
import '../WizardPage.css'

export function SettingsPage() {
  const { wedding } = useDashboard()
  const [loading, setLoading] = useState(true)
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [ceremonyTime, setCeremonyTime] = useState('')
  const [rsvpDeadline, setRsvpDeadline] = useState('')
  const [dressCode, setDressCode] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    weddingApi.getGuestPageConfig(wedding.id).then((config) => {
      if (cancelled) return
      setWelcomeMessage(config.welcomeMessage ?? '')
      setCeremonyTime(config.ceremonyTime ?? '')
      setRsvpDeadline(config.rsvpDeadline ?? '')
      setDressCode(config.dressCode ?? '')
      setContactPhone(config.contactPhone ?? '')
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [wedding.id])

  const inviteUrl = `${window.location.origin}/w/${wedding.slug}`

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await weddingApi.updateGuestPageConfig(wedding.id, {
        welcomeMessage: welcomeMessage.trim() || undefined,
        ceremonyTime: ceremonyTime || undefined,
        rsvpDeadline: rsvpDeadline || undefined,
        dressCode: dressCode.trim() || undefined,
        contactPhone: contactPhone.replace(/[\s-]/g, '') || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('לא הצלחנו לשמור את השינויים.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="dash-settings">
        <div className="dash-page-header">
          <p className="dash-page-title">דף האורחים והגדרות</p>
        </div>
        <p className="dash-page-sub">טוען...</p>
      </div>
    )
  }

  return (
    <div className="dash-settings">
      <div className="dash-page-header">
        <p className="dash-page-title">דף האורחים והגדרות</p>
        <p className="dash-page-sub">מה שהאורחים שלכם רואים בדף ההזמנה</p>
      </div>

      <div className="dash-invite-link-card">
        <p className="dash-invite-link-card__label">קישור לדף האורחים שלכם</p>
        <div className="dash-invite-link-card__row">
          <a href={inviteUrl} target="_blank" rel="noopener noreferrer" dir="ltr">
            {inviteUrl}
          </a>
        </div>
      </div>

      <div className="dash-settings-form">
        <div className="wizard-field">
          <label htmlFor="settings-welcome">הודעת פתיחה לאורחים</label>
          <textarea
            id="settings-welcome"
            rows={3}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="אנחנו כל כך שמחים שתצטרפו אלינו..."
          />
        </div>

        <div className="wizard-field-row">
          <div className="wizard-field">
            <label htmlFor="settings-ceremony-time">שעת האירוע</label>
            <input
              id="settings-ceremony-time"
              type="time"
              value={ceremonyTime}
              onChange={(e) => setCeremonyTime(e.target.value)}
            />
          </div>

          <div className="wizard-field">
            <label htmlFor="settings-contact-phone">טלפון ליצירת קשר</label>
            <input
              id="settings-contact-phone"
              type="tel"
              dir="ltr"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="050-1234567"
            />
          </div>
        </div>

        <div className="wizard-field">
          <label htmlFor="settings-rsvp-deadline">מועד אחרון לאישור הגעה</label>
          <DatePicker
            id="settings-rsvp-deadline"
            value={rsvpDeadline}
            onChange={setRsvpDeadline}
            max={wedding.date}
          />
        </div>

        <div className="wizard-field">
          <label htmlFor="settings-dress-code">קוד לבוש</label>
          <input
            id="settings-dress-code"
            type="text"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="לדוגמה: אלגנט"
          />
        </div>

        {error && <p className="dash-guest-error">{error}</p>}

        <button type="button" className="wizard-continue-btn" onClick={handleSave} disabled={saving}>
          {saved ? 'נשמר!' : saving ? 'שומר...' : 'שמרו שינויים'}
        </button>
      </div>
    </div>
  )
}
