import { useState, type FormEvent } from 'react'
import { isValidIsraeliMobile } from '../../utils/phone'

export interface GuestFormValues {
  name: string
  phone: string
  partySize: number
}

interface GuestFormProps {
  initial?: Partial<GuestFormValues>
  busy?: boolean
  submitLabel: string
  onSubmit: (values: GuestFormValues) => void | Promise<void>
  onCancel: () => void
}

export function GuestForm({ initial, busy, submitLabel, onSubmit, onCancel }: GuestFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [partySize, setPartySize] = useState(initial?.partySize ?? 1)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 1) {
      setError('נא להזין שם')
      return
    }
    if (phone.trim() && !isValidIsraeliMobile(phone)) {
      setError('מספר טלפון לא תקין')
      return
    }
    setError(null)
    onSubmit({ name: name.trim(), phone: phone.trim(), partySize })
  }

  return (
    <form className="guest-form" onSubmit={handleSubmit}>
      <input
        className="guest-form__input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם מלא"
        autoFocus
      />
      <input
        className="guest-form__input"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="טלפון (אופציונלי)"
      />
      <input
        className="guest-form__input guest-form__input--number"
        type="number"
        min={1}
        value={partySize}
        onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
      />
      {error && <p className="guest-form__error">{error}</p>}
      <div className="guest-form__actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy && <span className="spinner" />}
          {submitLabel}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          ביטול
        </button>
      </div>
    </form>
  )
}
