import { useState } from 'react'
import { VineDivider } from '../components/motifs/VineDivider'
import { BrandMark } from '../components/motifs/BrandMark'
import { AuthModal } from '../components/AuthModal'
import './LandingPage.css'

function ChecklistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z" />
      <path d="M8 5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2" />
      <path d="m9 12 2 2 4-4" />
      <path d="m9 17 2 2 4-4" />
    </svg>
  )
}

function ArmchairIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" />
      <path d="M4 12h16a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a1 1 0 0 1 1-1Z" />
      <path d="M6 18v2" />
      <path d="M18 18v2" />
    </svg>
  )
}

function ReportMoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M12 17v1M12 11v1" />
      <circle cx="12" cy="14" r="2.2" />
    </svg>
  )
}

export function LandingPage() {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null)

  return (
    <div className="landing-page">
      <div className="landing-shell">
        <nav className="landing-nav">
          <BrandMark size={32} className="landing-logo" />
          <div className="landing-nav-right">
            <button
              type="button"
              className="landing-login-link"
              onClick={() => setAuthMode('login')}
            >
              כניסה
            </button>
            <button
              type="button"
              className="landing-signup-btn"
              onClick={() => setAuthMode('signup')}
            >
              הרשמה
            </button>
          </div>
        </nav>

        <div className="landing-hero">
          <p className="landing-eyebrow">
            <span className="landing-eyebrow__rule" aria-hidden="true" />
            תכנון חתונה, בפשטות
            <span className="landing-eyebrow__rule" aria-hidden="true" />
          </p>
          <p className="landing-headline">
            כל החתונה שלכם
            <br />
            במקום אחד
          </p>
          <p className="landing-sub">אישורי הגעה, סידורי הושבה וניהול תקציב — בלי טבלאות אקסל, בלי בלגן.</p>
          <button type="button" className="landing-cta-seal" onClick={() => setAuthMode('signup')}>
            התחילו
            <br />
            בחינם
          </button>
        </div>

        <VineDivider leaves={[{ x: 200, r: 7 }]} />

        <div className="landing-features">
          <div className="landing-feature">
            <span className="landing-feature-icon landing-feature-icon--red">
              <ChecklistIcon />
            </span>
            <p className="landing-feature-title">אישורי הגעה</p>
            <p className="landing-feature-desc">טופס פשוט לאורחים, אישור אוטומטי בוואטסאפ</p>
          </div>
          <div className="landing-feature landing-feature--mid">
            <span className="landing-feature-icon landing-feature-icon--green">
              <ArmchairIcon />
            </span>
            <p className="landing-feature-title">סידור הושבה חכם</p>
            <p className="landing-feature-desc">אלגוריתם שמסדר את השולחנות בשבילכם</p>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon landing-feature-icon--gold">
              <ReportMoneyIcon />
            </span>
            <p className="landing-feature-title">ניהול תקציב</p>
            <p className="landing-feature-desc">מעקב אחר ספקים ותשלומים במקום אחד</p>
          </div>
        </div>
      </div>

      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />}
    </div>
  )
}
