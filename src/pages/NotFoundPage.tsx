import { Link } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import './AuthForm.css'

/** Catches every URL that doesn't match a real route - without this, React
 * Router renders nothing for an unmatched path and the visitor just sees a
 * blank page. */
export function NotFoundPage() {
  const { couple } = useAuth()

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          שמחה
        </Link>
        <p className="auth-title">הדף לא נמצא</p>
        <p className="auth-sub">הכתובת שהזנתם לא קיימת, או שהיא כבר לא בשימוש</p>
        <p className="auth-switch">
          <Link to={couple ? '/dashboard' : '/'}>{couple ? 'חזרה ללוח הבקרה' : 'חזרה לעמוד הבית'}</Link>
        </p>
      </div>
    </div>
  )
}
