import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'
import { weddingApi } from '../../api/wedding'
import type { Wedding } from '../../types/wedding'
import { Sidebar } from './Sidebar'
import { AppLoader } from '../../components/ui/AppLoader'
import './dashboard.css'

export function DashboardLayout() {
  const { couple, logout } = useAuth()
  const navigate = useNavigate()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [refetchIndex, setRefetchIndex] = useState(0)

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
  }, [navigate, refetchIndex])

  const refetchWedding = () => {
    setLoading(true)
    setError(null)
    setRefetchIndex((i) => i + 1)
  }

  if (!couple) return <AppLoader />
  if (loading) {
    return (
      <div className="dash-loading">
        <span className="dash-loading__spinner" aria-hidden="true" />
        <button type="button" className="dash-loading__logout-link" onClick={logout}>
          התנתקות
        </button>
      </div>
    )
  }
  if (error) {
    return (
      <div className="dash-loading">
        <div className="dash-loading__error-box">
          <p className="dash-loading__error">{error}</p>
          <div className="dash-loading__error-actions">
            <button type="button" className="dash-guest-btn" onClick={refetchWedding}>
              נסו שוב
            </button>
            <button type="button" className="dash-loading__logout-link" onClick={logout}>
              התנתקות
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (!wedding) return <AppLoader />

  return (
    <div className="dash-layout">
      <header className="dash-mobile-bar">
        <button
          type="button"
          className="dash-mobile-bar__toggle"
          onClick={() => setMobileNavOpen(true)}
          aria-label="פתחו תפריט"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
        <span className="dash-mobile-bar__logo">שמחה</span>
      </header>

      <div className={`dash-sidebar-wrap${mobileNavOpen ? ' dash-sidebar-wrap--open' : ''}`}>
        <div className="dash-sidebar-backdrop" onClick={() => setMobileNavOpen(false)} />
        <Sidebar wedding={wedding} onLogout={logout} onNavigate={() => setMobileNavOpen(false)} />
      </div>

      <main className="dash-main">
        <Outlet context={{ wedding, refetchWedding }} />
      </main>
    </div>
  )
}
