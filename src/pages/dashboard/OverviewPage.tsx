import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from './dashboard-context'
import { guestsApi } from '../../api/guests'
import { budgetApi } from '../../api/budget'
import type { Guest } from '../../types/guests'
import type { BudgetSummary } from '../../types/budget'
import { formatHebrewDate } from '../../lib/hebrewDate'
import './budget.css'

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date(new Date().toDateString())
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function OverviewPage() {
  const { wedding } = useDashboard()
  const [guests, setGuests] = useState<Guest[] | null>(null)
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    guestsApi.list(wedding.id).then((result) => {
      if (!cancelled) setGuests(result)
    })
    // A failed budget fetch just means no budget line in the to-do list -
    // it shouldn't take the whole overview down with it.
    budgetApi
      .getSummary(wedding.id)
      .then((result) => {
        if (!cancelled) setSummary(result)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [wedding.id])

  const inviteUrl = `${window.location.origin}/w/${wedding.slug}`
  const days = daysUntil(wedding.date)

  const confirmed = guests?.filter((g) => g.rsvpStatus === 'ATTENDING') ?? []
  const declined = guests?.filter((g) => g.rsvpStatus === 'DECLINED') ?? []
  const pending = guests?.filter((g) => g.rsvpStatus === 'PENDING') ?? []
  const confirmedGuestsCount = confirmed.reduce((sum, g) => sum + g.partySize, 0)

  const withoutPhone = (guests ?? []).filter((g) => !g.phone)
  const overdueTotal = (summary?.overduePayments ?? []).reduce((sum, p) => sum + p.amount, 0)

  const todos: { text: string; action: string; to: string; urgent: boolean }[] = []
  if (summary && summary.overduePayments.length > 0) {
    todos.push({
      text: `${summary.overduePayments.length} תשלומים באיחור · ₪${overdueTotal.toLocaleString()}`,
      action: 'לתקציב',
      to: '/dashboard/budget',
      urgent: true,
    })
  }
  if (pending.length > 0) {
    todos.push({
      text: `${pending.length} אורחים טרם השיבו על ההזמנה`,
      action: 'לאורחים',
      to: '/dashboard/guests',
      urgent: false,
    })
  }
  if (withoutPhone.length > 0) {
    todos.push({
      text: `${withoutPhone.length} אורחים בלי מספר טלפון — לא יקבלו הזמנה בוואטסאפ`,
      action: 'להשלמה',
      to: '/dashboard/guests',
      urgent: false,
    })
  }

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

      {/* Deliberately not the same five cards as the guest page: this is the
          "where do things stand" view, so it carries the countdown and one
          RSVP figure, and leaves the breakdown to the page that acts on it. */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <p className="dash-stat-card__label">
            {days >= 0 ? 'ימים לחתונה' : 'החתונה כבר הייתה'}
          </p>
          <p className="dash-stat-card__value">{days >= 0 ? days : 0}</p>
          <p className="dash-stat-card__note">{formatHebrewDate(wedding.date)}</p>
        </div>
        <div className="dash-stat-card dash-stat-card--good">
          <p className="dash-stat-card__label">אישרו הגעה</p>
          <p className="dash-stat-card__value">{confirmedGuestsCount}</p>
          <p className="dash-stat-card__note">
            {confirmed.length} מתוך {guests?.length ?? 0} רשומות
          </p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__label">ממתינים לתשובה</p>
          <p className="dash-stat-card__value">{pending.length}</p>
          <p className="dash-stat-card__note">{declined.length} השיבו שלא יגיעו</p>
        </div>
      </div>

      {/* The overview used to be a countdown and a link on an otherwise empty
          page, while the module pages carried everything. This is the part
          that belongs here: what still needs a decision, and where to go. */}
      <div className="dash-card">
        <div className="dash-card__header">
          <p className="dash-card__title">דורש טיפול</p>
        </div>
        {todos.length === 0 ? (
          <p className="dash-page-sub">הכל מסודר כרגע. 🎉</p>
        ) : (
          <ul className="dash-todo-list">
            {todos.map((todo) => (
              <li key={todo.to + todo.text}>
                <span className={todo.urgent ? 'dash-todo-list__dot is-urgent' : 'dash-todo-list__dot'} />
                <span className="dash-todo-list__text">{todo.text}</span>
                <Link to={todo.to} className="dash-todo-list__link">
                  {todo.action}
                </Link>
              </li>
            ))}
          </ul>
        )}
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
