import type { WizardData } from './types'
import { DatePicker } from '../ui/DatePicker'

interface StepEventDetailsProps {
  data: WizardData
  errors: Record<string, string>
  onChange: (patch: Partial<WizardData>) => void
}

export function StepEventDetails({ data, errors, onChange }: StepEventDetailsProps) {
  return (
    <div className="wizard-step">
      <p className="wizard-step__title">פרטי האירוע</p>
      <p className="wizard-step__sub">מידע שיעזור לאורחים שלכם ולכם בהמשך</p>

      <div className="wizard-field-row">
        <div className={`wizard-field${errors.ceremonyTime ? ' wizard-field--error' : ''}`}>
          <label htmlFor="wizard-ceremony-time">שעת האירוע</label>
          <input
            id="wizard-ceremony-time"
            type="time"
            value={data.ceremonyTime}
            onChange={(e) => onChange({ ceremonyTime: e.target.value })}
          />
          {errors.ceremonyTime && <p className="wizard-field__error">{errors.ceremonyTime}</p>}
        </div>

        <div className={`wizard-field${errors.contactPhone ? ' wizard-field--error' : ''}`}>
          <label htmlFor="wizard-contact-phone">טלפון ליצירת קשר</label>
          <input
            id="wizard-contact-phone"
            type="tel"
            value={data.contactPhone}
            onChange={(e) => onChange({ contactPhone: e.target.value })}
            placeholder="050-1234567"
            dir="ltr"
          />
          {errors.contactPhone && <p className="wizard-field__error">{errors.contactPhone}</p>}
          <p className="wizard-field__hint">משמש גם לאישורי הגעה בוואטסאפ</p>
        </div>
      </div>

      <div className="wizard-field">
        <label htmlFor="wizard-rsvp-deadline">מועד אחרון לאישור הגעה (לא חובה)</label>
        <DatePicker
          id="wizard-rsvp-deadline"
          value={data.rsvpDeadline}
          onChange={(rsvpDeadline) => onChange({ rsvpDeadline })}
          max={data.date || undefined}
          placeholder="בחרו תאריך"
        />
      </div>

      <div className="wizard-field">
        <label htmlFor="wizard-dress-code">קוד לבוש (לא חובה)</label>
        <input
          id="wizard-dress-code"
          type="text"
          value={data.dressCode}
          onChange={(e) => onChange({ dressCode: e.target.value })}
          placeholder="לדוגמה: אלגנט"
        />
      </div>
    </div>
  )
}
