import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import { useSlowConnection } from '../hooks/useSlowConnection'
import { BrandMark } from '../components/motifs/BrandMark'
import './AuthForm.css'

interface FieldErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'נא להזין אימייל תקין'
  }
  if (password.length < 1) {
    errors.password = 'נא להזין סיסמה'
  }
  return errors
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const slow = useSlowConnection(submitting)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fieldErrors = validate(email, password)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSubmitting(true)
    setFormError(null)
    try {
      await login({ email: email.trim(), password })
      navigate('/dashboard', { replace: true })
    } catch {
      setFormError('אימייל או סיסמה שגויים')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <BrandMark size={36} />
        </Link>
        <p className="auth-title">כניסה</p>
        <p className="auth-sub">התחברו כדי לנהל את החתונה שלכם</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className={`auth-field${errors.email ? ' auth-field--error' : ''}`}>
            <label htmlFor="login-email">אימייל</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
              }}
              placeholder="you@example.com"
              autoComplete="email"
              enterKeyHint="next"
            />
            {errors.email && <p className="auth-field__error">{errors.email}</p>}
          </div>

          <div className={`auth-field${errors.password ? ' auth-field--error' : ''}`}>
            <label htmlFor="login-password">סיסמה</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              enterKeyHint="go"
            />
            {errors.password && <p className="auth-field__error">{errors.password}</p>}
          </div>

          {formError && <p className="auth-page__error">{formError}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting && <span className="auth-spinner" aria-hidden="true" />}
            כניסה
          </button>
          {slow && <p className="auth-slow-hint">השרת מתעורר משינה, זה עלול לקחת כמה שניות...</p>}
        </form>

        <p className="auth-switch">
          אין לכם חשבון? <Link to="/signup">הרשמה</Link>
        </p>
      </div>
    </div>
  )
}
