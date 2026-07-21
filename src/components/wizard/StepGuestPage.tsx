import type { ChangeEvent } from 'react'
import type { WizardData } from './types'

interface ThemeOption {
  id: string
  label: string
  description: string
}

// Only one design exists today; structured as a list so more can be added later.
const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'classic',
    label: 'קלאסי',
    description: 'נייר, פינה קרועה וחותם שעווה — העיצוב שיש לנו היום',
  },
]

interface StepGuestPageProps {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
}

export function StepGuestPage({ data, onChange }: StepGuestPageProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    onChange({ heroPhotoName: file?.name ?? '' })
  }

  return (
    <div className="wizard-step">
      <p className="wizard-step__title">עיצוב דף האורחים</p>
      <p className="wizard-step__sub">כך ייראה הדף שהאורחים שלכם יראו</p>

      <div className="wizard-field">
        <label>ערכת עיצוב</label>
        <div className="wizard-theme-options">
          {THEME_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.id}
              className={`wizard-theme-option${data.theme === option.id ? ' wizard-theme-option--selected' : ''}`}
              onClick={() => onChange({ theme: option.id })}
            >
              <span className="wizard-theme-option__label">{option.label}</span>
              <span className="wizard-theme-option__desc">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="wizard-field">
        <label htmlFor="wizard-welcome">הודעת פתיחה לאורחים (לא חובה)</label>
        <textarea
          id="wizard-welcome"
          value={data.welcomeMessage}
          onChange={(e) => onChange({ welcomeMessage: e.target.value })}
          placeholder="אנחנו כל כך שמחים שתצטרפו אלינו..."
          rows={3}
        />
      </div>

      <div className="wizard-field">
        <label htmlFor="wizard-hero-photo">תמונת רקע (לא חובה)</label>
        <input id="wizard-hero-photo" type="file" accept="image/*" onChange={handleFileChange} />
        {data.heroPhotoName && <p className="wizard-field__hint">נבחר: {data.heroPhotoName}</p>}
      </div>
    </div>
  )
}
