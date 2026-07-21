import { Link } from 'react-router-dom'
import { VineDivider } from '../components/motifs/VineDivider'
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
  return (
    <div className="landing-page">
      <div className="landing-shell">
        <nav className="landing-nav">
          <span className="landing-logo">שמחה</span>
          <div className="landing-nav-right">
            <Link className="landing-login-link" to="/login">
              כניסה
            </Link>
            <Link className="landing-signup-btn" to="/signup">
              הרשמה
            </Link>
          </div>
        </nav>

        <div className="landing-hero">
          <p className="landing-eyebrow">תכנון חתונה, בפשטות</p>
          <p className="landing-headline">
            כל החתונה שלכם
            <br />
            במקום אחד
          </p>
          <p className="landing-sub">אישורי הגעה, סידורי הושבה וניהול תקציב — בלי טבלאות אקסל, בלי בלגן.</p>
          <Link className="landing-cta-seal" to="/signup">
            התחילו
            <br />
            בחינם
          </Link>
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
    </div>
  )
}
