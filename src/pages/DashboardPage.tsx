import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { weddingApi } from '../api/wedding'
import type { Wedding } from '../types/wedding'
import './DashboardPage.css'

export function DashboardPage() {
  const { couple, logout } = useAuth()
  const navigate = useNavigate()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    weddingApi
      .getMine()
      .then((result) => {
        if (cancelled) return
        if (!result) {
          navigate('/wedding/new', { replace: true })
          return
        }
        setWedding(result)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError('לא הצלחנו לטעון את פרטי החתונה שלכם.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  if (!couple) return null

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <span className="dashboard-logo">שמחה</span>
          <button className="dashboard-logout" onClick={logout}>
            יציאה
          </button>
        </header>

        <div className="dashboard-welcome">
          <p className="dashboard-welcome__label">מחוברים בתור</p>
          <p className="dashboard-welcome__name">{couple.name}</p>
          <p className="dashboard-welcome__email">{couple.email}</p>
        </div>

        {loading && <p className="dashboard-empty">טוען...</p>}
        {error && <p className="dashboard-error">{error}</p>}

        {wedding && (
          <>
            <h1 className="dashboard-heading">
              {wedding.coupleNameA} & {wedding.coupleNameB}
            </h1>
            <p className="dashboard-wedding-detail">
              {wedding.date} &nbsp;·&nbsp; {wedding.venue}
            </p>
            <a className="dashboard-wedding-link" href={`/w/${wedding.slug}`}>
              {window.location.origin}/w/{wedding.slug}
            </a>
          </>
        )}
      </div>
    </div>
  )
}
