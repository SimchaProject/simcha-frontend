import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useDashboard } from './dashboard-context'
import { weddingApi } from '../../api/wedding'
import { apiUrl } from '../../api/http'
import { DatePicker } from '../../components/ui/DatePicker'
import { ThemePicker } from '../../components/ui/ThemePicker'
import { resizeImage } from '../../utils/resizeImage'
import { formatHebrewDate } from '../../lib/hebrewDate'
import type { GuestPageThemeId } from '../../theme/guestPageThemes'
import type { ScheduleEntry } from '../../types/wedding'
import '../WizardPage.css'
import './guests.css'

interface ScheduleDraft {
  id: string
  time: string
  label: string
}

function newScheduleEntry(): ScheduleDraft {
  return { id: crypto.randomUUID(), time: '', label: '' }
}

export function SettingsPage() {
  const { wedding } = useDashboard()
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<GuestPageThemeId>('classic')
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [heroPhotoUrl, setHeroPhotoUrl] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [schedule, setSchedule] = useState<ScheduleDraft[]>([])
  const [ceremonyTime, setCeremonyTime] = useState('')
  const [rsvpDeadline, setRsvpDeadline] = useState('')
  const [dressCode, setDressCode] = useState('')
  const [mapUrl, setMapUrl] = useState('')
  const [parkingInfo, setParkingInfo] = useState('')
  const [payboxLink, setPayboxLink] = useState('')
  const [bankTransferDetails, setBankTransferDetails] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [mingleEnabled, setMingleEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    weddingApi.getGuestPageConfig(wedding.id).then((config) => {
      if (cancelled) return
      setTheme(config.theme)
      setAccentColor(config.accentColor)
      setHeroPhotoUrl(config.heroPhotoUrl)
      setWelcomeMessage(config.welcomeMessage ?? '')
      setSchedule(config.schedule.map((entry) => ({ id: crypto.randomUUID(), ...entry })))
      setCeremonyTime(config.ceremonyTime ?? '')
      setRsvpDeadline(config.rsvpDeadline ?? '')
      setDressCode(config.dressCode ?? '')
      setMapUrl(config.mapUrl ?? '')
      setParkingInfo(config.parkingInfo ?? '')
      setPayboxLink(config.payboxLink ?? '')
      setBankTransferDetails(config.bankTransferDetails ?? '')
      setContactPhone(config.contactPhone ?? '')
      setMingleEnabled(config.mingleEnabled)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [wedding.id])

  const inviteUrl = `${window.location.origin}/w/${wedding.slug}`

  const updateScheduleEntry = (id: string, patch: Partial<ScheduleDraft>) => {
    setSchedule((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))
  }

  const removeScheduleEntry = (id: string) => {
    setSchedule((prev) => prev.filter((entry) => entry.id !== id))
  }

  const addScheduleEntry = () => {
    setSchedule((prev) => [...prev, newScheduleEntry()])
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const cleanSchedule: ScheduleEntry[] = schedule
        .filter((entry) => entry.time.trim() && entry.label.trim())
        .map(({ time, label }) => ({ time: time.trim(), label: label.trim() }))
      await weddingApi.updateGuestPageConfig(wedding.id, {
        theme,
        accentColor: accentColor ?? undefined,
        welcomeMessage: welcomeMessage.trim() || undefined,
        schedule: cleanSchedule,
        ceremonyTime: ceremonyTime || undefined,
        rsvpDeadline: rsvpDeadline || undefined,
        dressCode: dressCode.trim() || undefined,
        mapUrl: mapUrl.trim() || undefined,
        parkingInfo: parkingInfo.trim() || undefined,
        payboxLink: payboxLink.trim() || undefined,
        bankTransferDetails: bankTransferDetails.trim() || undefined,
        mingleEnabled,
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

  // Photo changes go out immediately on selection, like the CSV import and
  // vendor-receipt uploads elsewhere in this app - a file picked is a
  // distinct action from the text fields the "שמרו שינויים" button covers.
  const handlePhotoPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    setPhotoError(null)
    try {
      const resized = await resizeImage(file, 960)
      await weddingApi.uploadHeroPhoto(wedding.id, resized)
      const fresh = await weddingApi.getGuestPageConfig(wedding.id)
      setHeroPhotoUrl(fresh.heroPhotoUrl)
    } catch {
      setPhotoError('לא הצלחנו להעלות את התמונה.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const handleRemovePhoto = async () => {
    setPhotoBusy(true)
    setPhotoError(null)
    try {
      await weddingApi.removeHeroPhoto(wedding.id)
      setHeroPhotoUrl(null)
    } catch {
      setPhotoError('לא הצלחנו להסיר את התמונה.')
    } finally {
      setPhotoBusy(false)
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

        <div className="wizard-field">
          <label>עיצוב דף האורחים</label>
          <ThemePicker
            themeId={theme}
            accentColor={accentColor}
            onThemeChange={setTheme}
            onAccentChange={setAccentColor}
            coupleNameA={wedding.coupleNameA}
            coupleNameB={wedding.coupleNameB}
            dateLabel={formatHebrewDate(wedding.date)}
            venue={wedding.venue}
            heroPhotoUrl={heroPhotoUrl}
          />
        </div>

        <div className="wizard-field">
          <label>תמונה בראש הדף</label>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoPicked}
          />
          <div className="settings-photo-row">
            {heroPhotoUrl && <img src={apiUrl(heroPhotoUrl)} alt="" className="settings-photo-preview" />}
            <button
              type="button"
              className="dash-guest-btn"
              onClick={() => photoInputRef.current?.click()}
              disabled={photoBusy}
            >
              {photoBusy ? 'מעלה...' : heroPhotoUrl ? 'החלפת תמונה' : 'העלאת תמונה'}
            </button>
            {heroPhotoUrl && (
              <button
                type="button"
                className="dash-guest-btn"
                onClick={handleRemovePhoto}
                disabled={photoBusy}
              >
                הסרה
              </button>
            )}
          </div>
          {photoError && <p className="dash-guest-error">{photoError}</p>}
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

        <div className="wizard-field">
          <label>סדר יום</label>
          <div className="settings-rows">
            {schedule.map((entry) => (
              <div className="settings-row" key={entry.id}>
                <input
                  type="text"
                  className="settings-row__time"
                  value={entry.time}
                  onChange={(e) => updateScheduleEntry(entry.id, { time: e.target.value })}
                  placeholder="17:00"
                />
                <input
                  type="text"
                  className="settings-row__label"
                  value={entry.label}
                  onChange={(e) => updateScheduleEntry(entry.id, { label: e.target.value })}
                  placeholder="קבלת פנים"
                />
                <button
                  type="button"
                  className="settings-row__remove"
                  onClick={() => removeScheduleEntry(entry.id)}
                  aria-label="הסרת שורה"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="dash-guest-btn" onClick={addScheduleEntry}>
              + הוספת שורה
            </button>
          </div>
        </div>

        <div className="wizard-field">
          <label htmlFor="settings-map-url">קישור ניווט (Waze / Google Maps)</label>
          <input
            id="settings-map-url"
            type="text"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="https://waze.com/..."
          />
        </div>

        <div className="wizard-field">
          <label htmlFor="settings-parking">הוראות חניה</label>
          <textarea
            id="settings-parking"
            rows={2}
            value={parkingInfo}
            onChange={(e) => setParkingInfo(e.target.value)}
          />
        </div>

        <div className="wizard-field">
          <label htmlFor="settings-paybox">קישור PayBox</label>
          <input
            id="settings-paybox"
            type="text"
            value={payboxLink}
            onChange={(e) => setPayboxLink(e.target.value)}
            placeholder="https://paybox.co.il/..."
          />
        </div>

        <div className="wizard-field">
          <label htmlFor="settings-bank">פרטי העברה בנקאית</label>
          <textarea
            id="settings-bank"
            rows={3}
            value={bankTransferDetails}
            onChange={(e) => setBankTransferDetails(e.target.value)}
          />
        </div>

        <div className="wizard-field">
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={mingleEnabled}
              onChange={(e) => setMingleEnabled(e.target.checked)}
            />
            פינת רווקים בדף האורחים
          </label>
          <p className="settings-toggle__note">
            מוסיף לטופס אישור ההגעה תיבת סימון אופציונלית &ldquo;מגיע/ה לבד ופתוח/ה להכיר&rdquo;. מי
            שמסמן מקבל קישור אישי לרשימה של שאר מי שסימנו — שם פרטי, גיל ומשפט חופשי בלבד, בלי
            טלפונים. אורחים שלא סימנו לא רואים את הרשימה ולא מופיעים בה.
          </p>
        </div>

        {error && <p className="dash-guest-error">{error}</p>}

        <button type="button" className="wizard-continue-btn" onClick={handleSave} disabled={saving}>
          {saved ? 'נשמר!' : saving ? 'שומר...' : 'שמרו שינויים'}
        </button>
      </div>
    </div>
  )
}
