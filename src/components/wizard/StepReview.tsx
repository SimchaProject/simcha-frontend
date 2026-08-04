import type { WizardData } from './types'
import { formatHebrewDate } from '../../lib/hebrewDate'

interface StepReviewProps {
  data: WizardData
}

export function StepReview({ data }: StepReviewProps) {
  return (
    <div className="wizard-step">
      <p className="wizard-step__title">סיכום</p>
      <p className="wizard-step__sub">בדקו שהכל נכון לפני שיוצרים את החתונה</p>

      <div className="wizard-review-section">
        <p className="wizard-review-section__title">פרטי הבסיס</p>
        <p className="wizard-review-row">
          {data.coupleNameA} &amp; {data.coupleNameB}
        </p>
        <p className="wizard-review-row">
          {data.date ? formatHebrewDate(data.date) : '—'} &nbsp;·&nbsp; {data.venue || '—'}
        </p>
        <p className="wizard-review-row" dir="ltr">
          simcha.app/w/{data.slug}
        </p>
      </div>

      <div className="wizard-review-section">
        <p className="wizard-review-section__title">דף האורחים</p>
        <p className="wizard-review-row">
          ערכת עיצוב: {data.theme === 'classic' ? 'קלאסי' : data.theme}
        </p>
        {data.welcomeMessage && <p className="wizard-review-row">"{data.welcomeMessage}"</p>}
        {data.heroPhotoName && <p className="wizard-review-row">תמונה: {data.heroPhotoName}</p>}
      </div>

      <div className="wizard-review-section">
        <p className="wizard-review-section__title">פרטי האירוע</p>
        <p className="wizard-review-row">שעה: {data.ceremonyTime || '—'}</p>
        <p className="wizard-review-row" dir="ltr">
          {data.contactPhone || '—'}
        </p>
        {data.rsvpDeadline && (
          <p className="wizard-review-row">מועד אחרון לאישור: {formatHebrewDate(data.rsvpDeadline)}</p>
        )}
        {data.dressCode && <p className="wizard-review-row">קוד לבוש: {data.dressCode}</p>}
      </div>
    </div>
  )
}
