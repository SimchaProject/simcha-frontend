import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import '../pages/AuthForm.css'
import './AuthModal.css'

type Mode = 'login' | 'signup'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
}

function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'נא להזין אימייל תקין'
  if (password.length < 1) errors.password = 'נא להזין סיסמה'
  return errors
}

function validateSignup(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (name.trim().length < 2) errors.name = 'נא להזין שם'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'נא להזין אימייל תקין'
  if (password.length < 8) errors.password = 'הסיסמה חייבת להכיל לפחות 8 תווים'
  return errors
}

interface AuthModalProps {
  initialMode: Mode
  onClose: () => void
}

export function AuthModal({ initialMode, onClose }: AuthModalProps) {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const switchMode = (next: Mode) => {
    setMode(next)
    setErrors({})
    setFormError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fieldErrors =
      mode === 'login' ? validateLogin(email, password) : validateSignup(name, email, password)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSubmitting(true)
    setFormError(null)
    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password })
      } else {
        await signup({ name: name.trim(), email: email.trim(), password })
      }
      navigate('/dashboard', { replace: true })
    } catch {
      setFormError(mode === 'login' ? 'אימייל או סיסמה שגויים' : 'לא ניתן ליצור חשבון, נסו שוב')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="סגירה">
          ×
        </button>

        <p className="auth-logo" style={{ cursor: 'default' }}>
          שמחה
        </p>

        <div className="auth-modal-tabs">
          <button
            type="button"
            className={`auth-modal-tab${mode === 'signup' ? ' auth-modal-tab--active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            הרשמה
          </button>
          <button
            type="button"
            className={`auth-modal-tab${mode === 'login' ? ' auth-modal-tab--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            כניסה
          </button>
        </div>

        <p className="auth-sub">
          {mode === 'login' ? 'התחברו כדי לנהל את החתונה שלכם' : 'התחילו לתכנן את החתונה שלכם בחינם'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <div className={`auth-field${errors.name ? ' auth-field--error' : ''}`}>
              <label htmlFor="modal-name">מי מתחתנים?</label>
              <input
                id="modal-name"
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
          )}

          <div className={`auth-field${errors.email ? ' auth-field--error' : ''}`}>
            <label htmlFor="modal-email">אימייל</label>
            <input
              id="modal-email"
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
            <label htmlFor="modal-password">סיסמה</label>
            <input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              placeholder={mode === 'login' ? '••••••••' : 'לפחות 8 תווים'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              enterKeyHint="go"
            />
            {errors.password && <p className="auth-field__error">{errors.password}</p>}
          </div>

          {formError && <p className="auth-page__error">{formError}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting && <span className="auth-spinner" aria-hidden="true" />}
            {mode === 'login' ? 'כניסה' : 'צרו חשבון'}
          </button>
        </form>
      </div>
    </div>
  )
}
