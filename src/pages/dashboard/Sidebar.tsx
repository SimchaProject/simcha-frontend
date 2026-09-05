import { NavLink } from 'react-router-dom'
import type { Wedding } from '../../types/wedding'
import { BrandMark } from '../../components/motifs/BrandMark'

interface SidebarProps {
  wedding: Wedding
  onLogout: () => void
  onNavigate?: () => void
}

function OverviewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 11.5 12 5l8 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10.5V19h12v-8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GuestsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15 13.5c2.4.3 4 2 4 4.3" strokeLinecap="round" />
    </svg>
  )
}

function SeatingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="4.5" cy="6" r="1.4" />
      <circle cx="19.5" cy="6" r="1.4" />
      <circle cx="4.5" cy="18" r="1.4" />
      <circle cx="19.5" cy="18" r="1.4" />
    </svg>
  )
}

function BudgetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v9M14.5 9.7c0-1.2-1.1-1.9-2.5-1.9s-2.5.8-2.5 2 1.1 1.6 2.5 1.9c1.4.3 2.5.8 2.5 2s-1.1 2-2.5 2-2.5-.7-2.5-1.9" strokeLinecap="round" />
    </svg>
  )
}

function VendorsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="3.5" y="8" width="17" height="11" rx="1.2" />
      <path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 4v1.6M12 18.4V20M20 12h-1.6M5.6 12H4M17.3 6.7l-1.1 1.1M7.8 16.2l-1.1 1.1M17.3 17.3l-1.1-1.1M7.8 7.8 6.7 6.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function linkClass({ isActive }: { isActive: boolean }) {
  return `dash-sidebar__link${isActive ? ' active' : ''}`
}

export function Sidebar({ wedding, onLogout, onNavigate }: SidebarProps) {
  return (
    <nav className="dash-sidebar" onClick={onNavigate}>
      <div className="dash-sidebar__brand">
        <BrandMark size={28} className="dash-sidebar__logo" />
        <p className="dash-sidebar__wedding">
          {wedding.coupleNameA} &amp; {wedding.coupleNameB}
        </p>
      </div>

      <div className="dash-sidebar__links">
        <NavLink to="/dashboard" end className={linkClass}>
          <OverviewIcon />
          סקירה כללית
        </NavLink>
        <NavLink to="/dashboard/guests" className={linkClass}>
          <GuestsIcon />
          אורחים
        </NavLink>
        <NavLink to="/dashboard/seating" className={linkClass}>
          <SeatingIcon />
          סידור הושבה
        </NavLink>
        <NavLink to="/dashboard/budget" className={linkClass}>
          <BudgetIcon />
          תקציב
        </NavLink>
        <NavLink to="/dashboard/vendors" className={linkClass}>
          <VendorsIcon />
          ספקים
        </NavLink>
        <NavLink to="/dashboard/settings" className={linkClass}>
          <SettingsIcon />
          דף האורחים והגדרות
        </NavLink>
      </div>

      <button type="button" className="dash-sidebar__logout" onClick={onLogout}>
        התנתקות
      </button>
    </nav>
  )
}
