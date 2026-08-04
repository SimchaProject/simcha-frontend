import type { WizardData } from './types'
import { generateSlug } from './slug'
import { DatePicker } from '../ui/DatePicker'

interface StepBasicsProps {
  data: WizardData
  errors: Record<string, string>
  onChange: (patch: Partial<WizardData>) => void
}

export function StepBasics({ data, errors, onChange }: StepBasicsProps) {
  const handleNameChange = (field: 'coupleNameA' | 'coupleNameB', value: string) => {
    const patch: Partial<WizardData> = { [field]: value }
    if (!data.slugEdited) {
      const nextA = field === 'coupleNameA' ? value : data.coupleNameA
      const nextB = field === 'coupleNameB' ? value : data.coupleNameB
      patch.slug = generateSlug(nextA, nextB)
    }
    onChange(patch)
  }

  return (
    <div className="wizard-step">
      <p className="wizard-step__title">פרטי הבסיס</p>
      <p className="wizard-step__sub">בואו נתחיל עם הפרטים המרכזיים של החתונה</p>

      <div className="wizard-field-row">
        <div className={`wizard-field${errors.coupleNameA ? ' wizard-field--error' : ''}`}>
          <label htmlFor="wizard-name-a">שם בן/בת הזוג הראשון/ה</label>
          <input
            id="wizard-name-a"
            type="text"
            value={data.coupleNameA}
            onChange={(e) => handleNameChange('coupleNameA', e.target.value)}
            placeholder="לדוגמה: נועה"
          />
          {errors.coupleNameA && <p className="wizard-field__error">{errors.coupleNameA}</p>}
        </div>

        <div className={`wizard-field${errors.coupleNameB ? ' wizard-field--error' : ''}`}>
          <label htmlFor="wizard-name-b">שם בן/בת הזוג השני/ה</label>
          <input
            id="wizard-name-b"
            type="text"
            value={data.coupleNameB}
            onChange={(e) => handleNameChange('coupleNameB', e.target.value)}
            placeholder="לדוגמה: איתי"
          />
          {errors.coupleNameB && <p className="wizard-field__error">{errors.coupleNameB}</p>}
        </div>
      </div>

      <div className={`wizard-field${errors.date ? ' wizard-field--error' : ''}`}>
        <label htmlFor="wizard-date">תאריך החתונה</label>
        <DatePicker
          id="wizard-date"
          value={data.date}
          onChange={(date) => onChange({ date })}
          hasError={Boolean(errors.date)}
        />
        {errors.date && <p className="wizard-field__error">{errors.date}</p>}
      </div>

      <div className={`wizard-field${errors.venue ? ' wizard-field--error' : ''}`}>
        <label htmlFor="wizard-venue">מקום האירוע</label>
        <input
          id="wizard-venue"
          type="text"
          value={data.venue}
          onChange={(e) => onChange({ venue: e.target.value })}
          placeholder="לדוגמה: גן האירוס, זכרון יעקב"
        />
        {errors.venue && <p className="wizard-field__error">{errors.venue}</p>}
      </div>

      <div className={`wizard-field${errors.slug ? ' wizard-field--error' : ''}`}>
        <label htmlFor="wizard-slug">כתובת דף האורחים</label>
        <input
          id="wizard-slug"
          type="text"
          value={data.slug}
          onChange={(e) => onChange({ slug: e.target.value, slugEdited: true })}
          placeholder="rotem-idan"
          dir="ltr"
        />
        {errors.slug && <p className="wizard-field__error">{errors.slug}</p>}
        <p className="wizard-field__hint" dir="ltr">
          simcha.app/w/{data.slug || '...'}
        </p>
      </div>
    </div>
  )
}
