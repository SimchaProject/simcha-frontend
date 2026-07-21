import type { WizardData } from './types'

interface StepReviewProps {
  data: WizardData
}

export function StepReview({ data }: StepReviewProps) {
  const totalCategoriesAmount = data.budgetCategories.reduce(
    (sum, c) => sum + (parseFloat(c.allocatedAmount) || 0),
    0,
  )
  const hasBudget = Boolean(data.totalBudget) || data.budgetCategories.length > 0

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
          {data.date || '—'} &nbsp;·&nbsp; {data.venue || '—'}
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
        <p className="wizard-review-section__title">תקציב</p>
        {hasBudget ? (
          <>
            <p className="wizard-review-row">תקציב כולל: ₪{data.totalBudget || 0}</p>
            {data.budgetCategories.map((c) => (
              <p className="wizard-review-row" key={c.id}>
                {c.name || 'קטגוריה'}: ₪{c.allocatedAmount || 0}
              </p>
            ))}
            {data.budgetCategories.length > 0 && (
              <p className="wizard-review-row wizard-review-row--muted">
                סה"כ הוקצה: ₪{totalCategoriesAmount}
              </p>
            )}
          </>
        ) : (
          <p className="wizard-review-row wizard-review-row--muted">
            לא הוגדר — ניתן להוסיף מאוחר יותר
          </p>
        )}
      </div>

      <div className="wizard-review-section">
        <p className="wizard-review-section__title">ספקים</p>
        {data.vendors.length > 0 ? (
          data.vendors.map((v) => (
            <p className="wizard-review-row" key={v.id}>
              {v.name || 'ספק'} — {v.category || '—'} {v.contactInfo && `· ${v.contactInfo}`}
            </p>
          ))
        ) : (
          <p className="wizard-review-row wizard-review-row--muted">
            לא הוגדרו — ניתן להוסיף מאוחר יותר
          </p>
        )}
      </div>
    </div>
  )
}
