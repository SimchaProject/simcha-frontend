import type { BudgetCategoryDraft, WizardData } from './types'

interface StepBudgetProps {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
  onSkip: () => void
}

function newCategory(): BudgetCategoryDraft {
  return { id: crypto.randomUUID(), name: '', allocatedAmount: '' }
}

export function StepBudget({ data, onChange, onSkip }: StepBudgetProps) {
  const updateCategory = (id: string, patch: Partial<BudgetCategoryDraft>) => {
    onChange({
      budgetCategories: data.budgetCategories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  const removeCategory = (id: string) => {
    onChange({ budgetCategories: data.budgetCategories.filter((c) => c.id !== id) })
  }

  const addCategory = () => {
    onChange({ budgetCategories: [...data.budgetCategories, newCategory()] })
  }

  return (
    <div className="wizard-step">
      <p className="wizard-step__title">תקציב</p>
      <p className="wizard-step__sub">אפשר לדלג ולהוסיף את זה מאוחר יותר מלוח הבקרה</p>
      <button type="button" className="wizard-skip-link" onClick={onSkip}>
        דלגו לעכשיו, אוסיף מאוחר יותר מלוח הבקרה
      </button>

      <div className="wizard-field">
        <label htmlFor="wizard-total-budget">תקציב כולל (₪)</label>
        <input
          id="wizard-total-budget"
          type="number"
          min="0"
          value={data.totalBudget}
          onChange={(e) => onChange({ totalBudget: e.target.value })}
          placeholder="150000"
        />
      </div>

      <div className="wizard-rows">
        <p className="wizard-rows__label">קטגוריות תקציב</p>
        {data.budgetCategories.map((category) => (
          <div className="wizard-row" key={category.id}>
            <input
              type="text"
              value={category.name}
              onChange={(e) => updateCategory(category.id, { name: e.target.value })}
              placeholder="שם הקטגוריה (לדוגמה: קייטרינג)"
              className="wizard-row__name"
            />
            <input
              type="number"
              min="0"
              value={category.allocatedAmount}
              onChange={(e) => updateCategory(category.id, { allocatedAmount: e.target.value })}
              placeholder="סכום"
              className="wizard-row__amount"
            />
            <button
              type="button"
              className="wizard-row__remove"
              onClick={() => removeCategory(category.id)}
              aria-label="הסירו קטגוריה"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="wizard-add-row" onClick={addCategory}>
          + הוסיפו קטגוריה
        </button>
      </div>
    </div>
  )
}
