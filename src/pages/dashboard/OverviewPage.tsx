import { useEffect, useState } from 'react'
import { useDashboard } from './dashboard-context'
import { guestsApi } from '../../api/guests'
import type { Guest } from '../../types/guest'
import { formatHebrewDate } from '../../lib/hebrewDate'

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date(new Date().toDateString())
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function OverviewPage() {
  const { wedding } = useDashboard()
  const [guests, setGuests] = useState<Guest[] | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    guestsApi.list(wedding.id).then((result) => {
      if (!cancelled) setGuests(result)
    })
    return () => {
      cancelled = true
    }
  }, [wedding.id])

  const inviteUrl = `${window.location.origin}/w/${wedding.slug}`
  const days = daysUntil(wedding.date)

  const confirmed = guests?.filter((g) => g.rsvpStatus === 'confirmed') ?? []
  const declined = guests?.filter((g) => g.rsvpStatus === 'declined') ?? []
  const pending = guests?.filter((g) => g.rsvpStatus === 'pending') ?? []
  const confirmedGuestsCount = confirmed.reduce((sum, g) => sum + g.partySize, 0)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="dash-overview">
      <div className="dash-page-header">
        <p className="dash-page-title">
          {wedding.coupleNameA} &amp; {wedding.coupleNameB}
        </p>
        <p className="dash-page-sub">
          {formatHebrewDate(wedding.date)} &nbsp;·&nbsp; {wedding.venue}
        </p>
      </div>

      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <p className="dash-stat-card__value">{days >= 0 ? days : 0}</p>
          <p className="dash-stat-card__label">{days >= 0 ? 'ימים לחתונה' : 'החתונה כבר הייתה'}</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__value">{guests?.length ?? '—'}</p>
          <p className="dash-stat-card__label">אורחים ברשימה</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__value">{confirmedGuestsCount}</p>
          <p className="dash-stat-card__label">מגיעים מאושרים</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__value">{pending.length}</p>
          <p className="dash-stat-card__label">ממתינים לאישור</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__value">{declined.length}</p>
          <p className="dash-stat-card__label">לא מגיעים</p>
        </div>
      </div>

      <div className="dash-invite-link-card">
        <p className="dash-invite-link-card__label">קישור לדף האורחים שלכם</p>
        <div className="dash-invite-link-card__row">
          <a href={inviteUrl} target="_blank" rel="noopener noreferrer" dir="ltr">
            {inviteUrl}
          </a>
          <button type="button" onClick={handleCopy}>
            {copied ? 'הועתק!' : 'העתיקו'}
          </button>
        </div>
      </div>
    </div>
  )
}
