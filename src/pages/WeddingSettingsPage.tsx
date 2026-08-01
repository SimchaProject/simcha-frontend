import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { weddingApi } from '../api/wedding'
import type { Wedding } from '../types/wedding'
import './WeddingSettingsPage.css'

interface ScheduleDraft {
  id: string
  time: string
  label: string
}

function newScheduleEntry(): ScheduleDraft {
  return { id: crypto.randomUUID(), time: '', label: '' }
}

export function WeddingSettingsPage() {
  const { weddingId } = useParams<{ weddingId: string }>()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [heroPhotoUrl, setHeroPhotoUrl] = useState('')
  const [schedule, setSchedule] = useState<ScheduleDraft[]>([])
  const [mapUrl, setMapUrl] = useState('')
  const [parkingInfo, setParkingInfo] = useState('')
  const [payboxLink, setPayboxLink] = useState('')
  const [bankTransferDetails, setBankTransferDetails] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  useEffect(() => {
    if (!weddingId) return
    weddingApi
      .getMine()
      .then((result) => {
        if (!result) {
          setError('לא נמצאה חתונה')
          setLoading(false)
          return
        }
        setWedding(result)
        setWelcomeMessage(result.guestPageConfig.welcomeMessage ?? '')
        setHeroPhotoUrl(result.guestPageConfig.heroPhotoUrl ?? '')
        setSchedule(
          result.guestPageConfig.schedule.map((entry) => ({
            id: crypto.randomUUID(),
            ...entry,
          })),
        )
        setMapUrl(result.guestPageConfig.mapUrl ?? '')
        setParkingInfo(result.guestPageConfig.parkingInfo ?? '')
        setPayboxLink(result.guestPageConfig.payboxLink ?? '')
        setBankTransferDetails(result.guestPageConfig.bankTransferDetails ?? '')
        setContactPhone(result.guestPageConfig.contactPhone ?? '')
        setLoading(false)
      })
      .catch((e) => {
        setError(String(e))
        setLoading(false)
      })
  }, [weddingId])

  const updateScheduleEntry = (id: string, patch: Partial<ScheduleDraft>) => {
    setSchedule((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))
  }

  const removeScheduleEntry = (id: string) => {
    setSchedule((prev) => prev.filter((entry) => entry.id !== id))
  }

  const addScheduleEntry = () => {
    setSchedule((prev) => [...prev, newScheduleEntry()])
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!weddingId) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await weddingApi.updateGuestPageConfig(weddingId, {
        welcomeMessage: welcomeMessage.trim() || undefined,
        heroPhotoUrl: heroPhotoUrl.trim() || undefined,
        schedule: schedule
          .filter((entry) => entry.time.trim() && entry.label.trim())
          .map(({ time, label }) => ({ time: time.trim(), label: label.trim() })),
        mapUrl: mapUrl.trim() || undefined,
        parkingInfo: parkingInfo.trim() || undefined,
        payboxLink: payboxLink.trim() || undefined,
        bankTransferDetails: bankTransferDetails.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      })
      setSaved(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  if (!weddingId) return <p className="settings-page__error">No wedding selected.</p>

  if (loading) {
    return (
      <div className="settings-page">
        <p className="settings-page__empty">טוען...</p>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h1>הגדרות והזמנה</h1>
        <p className="settings-page__subtitle">
          כל השדות כאן מוצגים לאורחים בעמוד ההזמנה הציבורי
          {wedding && ` (/w/${wedding.slug})`}
        </p>
      </header>

      {error && <p className="settings-page__error">{error}</p>}
      {saved && <p className="settings-page__saved">נשמר בהצלחה</p>}

      <form className="settings-form" onSubmit={handleSubmit}>
        <section className="settings-section">
          <h2>תוכן עמוד ההזמנה</h2>
          <label className="settings-field">
            <span>הודעת פתיחה</span>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
            />
          </label>
          <label className="settings-field">
            <span>קישור לתמונת רקע</span>
            <input
              type="text"
              value={heroPhotoUrl}
              onChange={(e) => setHeroPhotoUrl(e.target.value)}
            />
          </label>
        </section>

        <section className="settings-section">
          <h2>סדר יום</h2>
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
            <button type="button" className="btn btn--ghost" onClick={addScheduleEntry}>
              + הוספת שורה
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>הגעה וחניה</h2>
          <label className="settings-field">
            <span>קישור ניווט (Waze / Google Maps)</span>
            <input
              type="text"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://waze.com/..."
            />
          </label>
          <label className="settings-field">
            <span>הוראות חניה</span>
            <textarea value={parkingInfo} onChange={(e) => setParkingInfo(e.target.value)} rows={2} />
          </label>
        </section>

        <section className="settings-section">
          <h2>עדכוני אישור הגעה</h2>
          <label className="settings-field">
            <span>מספר טלפון ליצירת קשר</span>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="050-1234567"
            />
          </label>
          <p className="settings-field__hint">
            כשאורח מאשר או מבטל הגעה, הוא יוכל לשלוח לכם עדכון בוואטסאפ למספר הזה. בלי מספר כאן, אפשרות זו לא תוצג לאורחים.
          </p>
        </section>

        <section className="settings-section">
          <h2>מתנה</h2>
          <label className="settings-field">
            <span>קישור PayBox</span>
            <input
              type="text"
              value={payboxLink}
              onChange={(e) => setPayboxLink(e.target.value)}
              placeholder="https://paybox.co.il/..."
            />
          </label>
          <label className="settings-field">
            <span>פרטי העברה בנקאית</span>
            <textarea
              value={bankTransferDetails}
              onChange={(e) => setBankTransferDetails(e.target.value)}
              rows={3}
            />
          </label>
        </section>

        <div className="settings-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving && <span className="spinner" />}
            שמירה
          </button>
        </div>
      </form>
    </div>
  )
}
