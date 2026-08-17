import { useEffect, useRef, useState } from 'react'
import { useDashboard } from './dashboard-context'
import { budgetApi } from '../../api/budget'
import type { BudgetSummary } from '../../types/budget'
import './budget.css'

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'מקדמה',
  INSTALLMENT: 'תשלום',
  FINAL: 'תשלום סופי',
}

export function BudgetPage() {
  const { wedding } = useDashboard()
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [totalDraft, setTotalDraft] = useState('')
  const [savingTotal, setSavingTotal] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryAmount, setNewCategoryAmount] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryAmount, setEditCategoryAmount] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)

  // Several actions on this page (save total, add/remove category) all
  // call load() to refresh, so more than one request can be in flight at
  // once - guard against an older, slower response overwriting a newer
  // one when they resolve out of order.
  const latestRequestId = useRef(0)

  const load = () => {
    const requestId = ++latestRequestId.current
    budgetApi
      .getSummary(wedding.id)
      .then((result) => {
        if (requestId !== latestRequestId.current) return
        setSummary(result)
        setTotalDraft(String(result.totalAmount))
        setLoading(false)
      })
      .catch(() => {
        if (requestId !== latestRequestId.current) return
        setError('לא הצלחנו לטעון את התקציב.')
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding.id])

  const handleSaveTotal = async () => {
    if (!totalDraft) return
    setSavingTotal(true)
    try {
      await budgetApi.updateBudget(wedding.id, { totalAmount: Number(totalDraft) })
      load()
    } catch {
      setError('לא הצלחנו לשמור את סכום התקציב.')
    } finally {
      setSavingTotal(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryAmount) return
    setAddingCategory(true)
    try {
      await budgetApi.createCategory(wedding.id, {
        name: newCategoryName.trim(),
        allocatedAmount: Number(newCategoryAmount),
      })
      setNewCategoryName('')
      setNewCategoryAmount('')
      load()
    } catch {
      setError('לא הצלחנו להוסיף את הקטגוריה.')
    } finally {
      setAddingCategory(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('להסיר את הקטגוריה?')) return
    await budgetApi.removeCategory(wedding.id, categoryId)
    load()
  }

  const startEditCategory = (category: BudgetSummary['categories'][number]) => {
    setEditingCategoryId(category.id)
    setEditCategoryName(category.name)
    setEditCategoryAmount(String(category.allocatedAmount))
  }

  const cancelEditCategory = () => {
    setEditingCategoryId(null)
    setEditCategoryName('')
    setEditCategoryAmount('')
  }

  const handleSaveCategory = async (categoryId: string) => {
    if (!editCategoryName.trim() || !editCategoryAmount) return
    setSavingCategory(true)
    try {
      await budgetApi.updateCategory(wedding.id, categoryId, {
        name: editCategoryName.trim(),
        allocatedAmount: Number(editCategoryAmount),
      })
      cancelEditCategory()
      load()
    } catch {
      setError('לא הצלחנו לשמור את הקטגוריה.')
    } finally {
      setSavingCategory(false)
    }
  }

  if (loading || !summary) {
    return (
      <div className="dash-budget">
        <div className="dash-page-header">
          <p className="dash-page-title">תקציב</p>
        </div>
        <div className="dash-page-loading">
          <span className="dash-loading__spinner" aria-hidden="true" />
        </div>
      </div>
    )
  }

  return (
    <div className="dash-budget">
      <div className="dash-page-header">
        <p className="dash-page-title">תקציב</p>
        <p className="dash-page-sub">מעקב אחר תקציב, ספקים, ותשלומים</p>
      </div>

      {error && <p className="dash-guest-error">{error}</p>}

      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <p className="dash-stat-card__value">₪{summary.totalAmount.toLocaleString()}</p>
          <p className="dash-stat-card__label">תקציב כולל</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__value">₪{summary.totalPaid.toLocaleString()}</p>
          <p className="dash-stat-card__label">שולם בפועל</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__value">₪{summary.totalRemaining.toLocaleString()}</p>
          <p className="dash-stat-card__label">נותר לאחר תשלומים</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__value">₪{summary.totalCommitted.toLocaleString()}</p>
          <p className="dash-stat-card__label">מחויב לספקים</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__value">₪{summary.remainingAfterCommitments.toLocaleString()}</p>
          <p className="dash-stat-card__label">נותר להקצאה</p>
        </div>
      </div>
      <p className="dash-page-sub dash-budget-hint">
        &ldquo;מחויב לספקים&rdquo; = סכום החוזה של כל ספק שסטטוסו &ldquo;הוזמן&rdquo; או &ldquo;שולם&rdquo;, גם אם עוד לא נרשם
        תשלום בפועל. &ldquo;שולם בפועל&rdquo; מבוסס על תשלומים שסומנו כשולמו בלשונית התשלומים של הספק — אם אין לו אף
        תשלום רשום, אבל סימנתם את הספק עצמו כ&ldquo;שולם&rdquo;, כל סכום החוזה שלו יחשב כשולם.
      </p>

      <div className="dash-budget-total-row">
        <input
          type="number"
          min="0"
          value={totalDraft}
          onChange={(e) => setTotalDraft(e.target.value)}
        />
        <button type="button" onClick={handleSaveTotal} disabled={savingTotal}>
          עדכנו תקציב כולל
        </button>
      </div>

      <div className="dash-budget-section">
        <p className="dash-budget-section__title">קטגוריות</p>
        {summary.categories.length === 0 ? (
          <p className="dash-page-sub">עדיין אין קטגוריות. הוסיפו למטה.</p>
        ) : (
          <div className="dash-budget-categories">
            {summary.categories.map((category) => {
              const paidPercent =
                category.allocatedAmount > 0
                  ? Math.min(100, Math.round((category.actualAmount / category.allocatedAmount) * 100))
                  : 0
              const committedPercent =
                category.allocatedAmount > 0
                  ? Math.min(100, Math.round((category.committedAmount / category.allocatedAmount) * 100))
                  : 0
              const over = category.committedAmount > category.allocatedAmount
              const overAmount = category.committedAmount - category.allocatedAmount

              if (editingCategoryId === category.id) {
                return (
                  <div className="dash-budget-category" key={category.id}>
                    <div className="dash-budget-category__edit-row">
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        value={editCategoryAmount}
                        onChange={(e) => setEditCategoryAmount(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCategory(category.id)}
                        disabled={savingCategory || !editCategoryName.trim() || !editCategoryAmount}
                      >
                        שמרו
                      </button>
                      <button type="button" onClick={cancelEditCategory}>
                        ביטול
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div className="dash-budget-category" key={category.id}>
                  <div className="dash-budget-category__header">
                    <span>{category.name}</span>
                    {over && (
                      <span className="dash-budget-category__over-badge">
                        בחריגה של ₪{overAmount.toLocaleString()}
                      </span>
                    )}
                    <span>
                      ₪{category.actualAmount.toLocaleString()} / ₪{category.allocatedAmount.toLocaleString()}
                    </span>
                    <button type="button" onClick={() => startEditCategory(category)}>
                      ערכו
                    </button>
                    <button type="button" onClick={() => handleDeleteCategory(category.id)}>
                      הסירו
                    </button>
                  </div>
                  <div className="dash-budget-bar">
                    <div
                      className="dash-budget-bar__fill dash-budget-bar__fill--committed"
                      style={{ width: `${committedPercent}%` }}
                    />
                    <div
                      className={`dash-budget-bar__fill dash-budget-bar__fill--paid${over ? ' dash-budget-bar__fill--over' : ''}`}
                      style={{ width: `${paidPercent}%` }}
                    />
                  </div>
                  <div className="dash-budget-category__legend">
                    <span>
                      <span className="dash-budget-category__legend-dot dash-budget-category__legend-dot--paid" />
                      שולם ₪{category.actualAmount.toLocaleString()}
                    </span>
                    <span>
                      <span className="dash-budget-category__legend-dot dash-budget-category__legend-dot--committed" />
                      מחויב ₪{category.committedAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="dash-budget-add-category-row">
          <input
            type="text"
            placeholder="שם קטגוריה"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <input
            type="number"
            min="0"
            placeholder="סכום מתוקצב"
            value={newCategoryAmount}
            onChange={(e) => setNewCategoryAmount(e.target.value)}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={addingCategory || !newCategoryName.trim() || !newCategoryAmount}
          >
            + הוסיפו קטגוריה
          </button>
        </div>
      </div>

      <div className="dash-budget-section">
        <p className="dash-budget-section__title dash-budget-section__title--overdue">
          תשלומים באיחור ({summary.overduePayments.length})
        </p>
        {summary.overduePayments.length === 0 ? (
          <p className="dash-page-sub">אין תשלומים באיחור.</p>
        ) : (
          <ul className="dash-budget-payment-list dash-budget-payment-list--overdue">
            {summary.overduePayments.map((payment) => (
              <li key={payment.id}>
                <span>{payment.vendorName}</span>
                <span>{PAYMENT_TYPE_LABELS[payment.paymentType]}</span>
                <span>₪{payment.amount.toLocaleString()}</span>
                <span>{payment.dueDate}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dash-budget-section">
        <p className="dash-budget-section__title">תשלומים קרובים ({summary.upcomingPayments.length})</p>
        {summary.upcomingPayments.length === 0 ? (
          <p className="dash-page-sub">אין תשלומים קרובים מתוזמנים.</p>
        ) : (
          <ul className="dash-budget-payment-list">
            {summary.upcomingPayments.map((payment) => (
              <li key={payment.id}>
                <span>{payment.vendorName}</span>
                <span>{PAYMENT_TYPE_LABELS[payment.paymentType]}</span>
                <span>₪{payment.amount.toLocaleString()}</span>
                <span>{payment.dueDate}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
