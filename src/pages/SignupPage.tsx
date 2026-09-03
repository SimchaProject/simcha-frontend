import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import './AuthForm.css'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
}

function validate(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (name.trim().length < 2) {
    errors.name = 'נא להזין שם'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'נא להזין אימייל תקין'
  }
  if (password.length < 8) {
    errors.password = 'הסיסמה חייבת להכיל לפחות 8 תווים'
  }
  return errors
}

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fieldErrors = validate(name, email, password)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSubmitting(true)
    setFormError(null)
    try {
      await signup({ name: name.trim(), email: email.trim(), password })
      navigate('/dashboard', { replace: true })
    } catch {
      setFormError('לא ניתן ליצור חשבון, נסו שוב')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          שמחה
        </Link>
        <p className="auth-title">הרשמה</p>
        <p className="auth-sub">התחילו לתכנן את החתונה שלכם בחינם</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className={`auth-field${errors.name ? ' auth-field--error' : ''}`}>
            <label htmlFor="signup-name">מי מתחתנים?</label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              placeholder="לדוגמה: נועה ואיתי"
              autoComplete="name"
              enterKeyHint="next"
            />
            {errors.name && <p className="auth-field__error">{errors.name}</p>}
          </div>

          <div className={`auth-field${errors.email ? ' auth-field--error' : ''}`}>
            <label htmlFor="signup-email">אימייל</label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password">סיסמה</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              placeholder="לפחות 8 תווים"
              autoComplete="new-password"
              enterKeyHint="go"
            />
            {errors.password && <p className="auth-field__error">{errors.password}</p>}
          </div>

          {formError && <p className="auth-page__error">{formError}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting && <span className="auth-spinner" aria-hidden="true" />}
            צרו חשבון
          </button>
        </form>

        <p className="auth-switch">
          כבר יש לכם חשבון? <Link to="/login">כניסה</Link>
        </p>
      </div>
    </div>
  )
}
