import { useEffect, useRef, useState } from 'react'
import { useDashboard } from './dashboard-context'
import { budgetApi } from '../../api/budget'
import { vendorsApi } from '../../api/vendors'
import type { BudgetBurndown, BudgetPaymentSummary, BudgetSummary } from '../../types/budget'
import { VENDOR_CATEGORY_PRESETS } from '../../constants/vendorCategories'
import { BurndownChart } from '../../components/budget/BurndownChart'
import './budget.css'

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'מקדמה',
  INSTALLMENT: 'תשלום',
  FINAL: 'תשלום סופי',
}

const COMMITTED_HINT =
  'התקציב שנשאר לפני שמזמינים ספקים נוספים - אחרי הפחתת סכום החוזה של כל ספק שכבר סומן "הוזמן" או "שולם", גם אם עדיין לא הועבר תשלום בפועל. שונה מ"נותר לתשלום", שמחשב רק מה שכבר שולם בפועל.'

function formatDate(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year.slice(2)}`
}

export function BudgetPage() {
  const { wedding } = useDashboard()
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [burndown, setBurndown] = useState<BudgetBurndown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingTotal, setEditingTotal] = useState(false)
  const [totalDraft, setTotalDraft] = useState('')
  const [savingTotal, setSavingTotal] = useState(false)

  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryAmount, setNewCategoryAmount] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const categoryAmountRef = useRef<HTMLInputElement>(null)

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryAmount, setEditCategoryAmount] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)

  const [payingId, setPayingId] = useState<string | null>(null)

  // Several actions on this page (save total, add/remove category, mark a
  // payment paid) all call load() to refresh, so more than one request can be
  // in flight at once - guard against an older, slower response overwriting a
  // newer one when they resolve out of order.
  const latestRequestId = useRef(0)

  const load = () => {
    const requestId = ++latestRequestId.current
    Promise.all([budgetApi.getSummary(wedding.id), budgetApi.getBurndown(wedding.id)])
      .then(([result, curve]) => {
        if (requestId !== latestRequestId.current) return
        setSummary(result)
        setBurndown(curve)
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
      setEditingTotal(false)
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

  // Settling a payment used to mean leaving this page for Vendors, finding
  // the vendor, opening its payments panel and marking it there. The payment
  // is already listed right here, so the action belongs here too.
  const handleMarkPaid = async (payment: BudgetPaymentSummary) => {
    setPayingId(payment.id)
    try {
      await vendorsApi.updatePayment(wedding.id, payment.vendorId, payment.id, { status: 'PAID' })
      load()
    } catch {
      setError('לא הצלחנו לסמן את התשלום כשולם.')
    } finally {
      setPayingId(null)
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

  const duePayments = [...summary.overduePayments, ...summary.upcomingPayments]

  const renderPaymentRow = (payment: BudgetPaymentSummary) => (
    <li key={payment.id} className={payment.isOverdue ? 'is-overdue' : undefined}>
      <span className="dash-budget-payment__vendor">{payment.vendorName}</span>
      <span className="dash-budget-payment__type">{PAYMENT_TYPE_LABELS[payment.paymentType]}</span>
      <span className="dash-budget-payment__amount">₪{payment.amount.toLocaleString()}</span>
      <span className="dash-budget-payment__date">
        {payment.isOverdue ? 'היה אמור להיות משולם ב-' : 'עד '}
        {formatDate(payment.dueDate)}
      </span>
      <button
        type="button"
        className="dash-btn dash-budget-payment__action"
        onClick={() => handleMarkPaid(payment)}
        disabled={payingId === payment.id}
      >
        {payingId === payment.id ? 'רגע...' : 'סמנו כשולם'}
      </button>
    </li>
  )

  return (
    <div className="dash-budget">
      <div className="dash-page-header dash-page-header--row">
        <div>
          <p className="dash-page-title">תקציב</p>
          <p className="dash-page-sub">
            תקציב כולל ₪{summary.totalAmount.toLocaleString()} · {summary.categories.length}{' '}
            קטגוריות
          </p>
        </div>
        <div className="dash-page-actions">
          <button type="button" className="dash-btn" onClick={() => setEditingTotal((v) => !v)}>
            עדכון תקציב
          </button>
        </div>
      </div>

      {error && <p className="dash-guest-error">{error}</p>}

      {editingTotal && (
        <div className="dash-panel">
          <p className="dash-panel__title">תקציב כולל לחתונה</p>
          <div className="dash-budget-total-row">
            <input
              type="number"
              min="0"
              className="dash-field"
              autoFocus
              value={totalDraft}
              onChange={(e) => setTotalDraft(e.target.value)}
            />
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={handleSaveTotal}
              disabled={savingTotal}
            >
              שמרו
            </button>
          </div>
        </div>
      )}

      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <p className="dash-stat-card__label">שולם בפועל</p>
          <p className="dash-stat-card__value">₪{summary.totalPaid.toLocaleString()}</p>
          <p className="dash-stat-card__note">
            {Math.round((summary.totalPaid / (summary.totalAmount || 1)) * 100)}% מהתקציב
          </p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__label">נותר לתשלום</p>
          <p className="dash-stat-card__value">₪{summary.totalRemaining.toLocaleString()}</p>
          <p className="dash-stat-card__note">מתוך התקציב הכולל</p>
        </div>
        <div
          className={`dash-stat-card${
            summary.remainingAfterCommitments < 0 ? ' dash-stat-card--alert' : ''
          }`}
          title={COMMITTED_HINT}
        >
          <p className="dash-stat-card__label">תקציב פנוי להזמנות חדשות</p>
          <p className="dash-stat-card__value">
            ₪{summary.remainingAfterCommitments.toLocaleString()}
          </p>
          <p className="dash-stat-card__note">
            לאחר ₪{summary.totalCommitted.toLocaleString()} שכבר הוזמן/שולם אצל ספקים
          </p>
        </div>
      </div>

      {burndown && (
        <div className="dash-card">
          <div className="dash-card__header">
            <p className="dash-card__title">שריפת תקציב עד החתונה</p>
          </div>
          <BurndownChart data={burndown} />
        </div>
      )}

      <div className="dash-card">
        <div className="dash-card__header">
          <p className="dash-card__title">תשלומים פתוחים ({duePayments.length})</p>
          {summary.overduePayments.length > 0 && (
            <span className="dash-card__flag">{summary.overduePayments.length} באיחור</span>
          )}
        </div>
        {duePayments.length === 0 ? (
          <p className="dash-page-sub">אין תשלומים פתוחים.</p>
        ) : (
          <ul className="dash-budget-payment-list">{duePayments.map(renderPaymentRow)}</ul>
        )}
      </div>

      <div className="dash-card">
        {/* Adding a category belongs beside the list it adds to, not up in the
            page header - the header action is for the page, this is for this
            card. */}
        <div className="dash-card__header">
          <p className="dash-card__title">קטגוריות</p>
          <button
            type="button"
            className="dash-btn dash-btn--primary dash-btn--sm"
            onClick={() => setShowAddCategory((v) => !v)}
          >
            {showAddCategory ? 'סגירה' : '+ קטגוריה'}
          </button>
        </div>

        {showAddCategory && (
          <div className="dash-budget-add-category">
            {/* Presets are a shortcut for the empty case, so they live inside
                the add flow instead of sitting above the data permanently. */}
            <div className="dash-budget-preset-row">
              {VENDOR_CATEGORY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="dash-budget-preset-chip"
                  onClick={() => {
                    setNewCategoryName(preset.label)
                    categoryAmountRef.current?.focus()
                  }}
                >
                  <span>{preset.icon}</span> {preset.label}
                </button>
              ))}
            </div>
            <div className="dash-budget-add-category-row">
              <input
                type="text"
                className="dash-field"
                placeholder="שם קטגוריה"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <input
                ref={categoryAmountRef}
                type="number"
                min="0"
                className="dash-field"
                placeholder="סכום מתוקצב"
                value={newCategoryAmount}
                onChange={(e) => setNewCategoryAmount(e.target.value)}
              />
              <button
                type="button"
                className="dash-btn dash-btn--primary"
                onClick={handleAddCategory}
                disabled={addingCategory || !newCategoryName.trim() || !newCategoryAmount}
              >
                הוסיפו
              </button>
            </div>
          </div>
        )}

        {summary.categories.length === 0 ? (
          <p className="dash-page-sub">
            עדיין אין קטגוריות תקציב. הוסיפו את הראשונה כדי לראות פילוח הוצאות.
          </p>
        ) : (
          <div className="dash-budget-categories">
            {summary.categories.map((category) => {
              const paidPercent =
                category.allocatedAmount > 0
                  ? Math.min(100, Math.round((category.actualAmount / category.allocatedAmount) * 100))
                  : 0
              const committedPercent =
                category.allocatedAmount > 0
                  ? Math.min(
                      100,
                      Math.round((category.committedAmount / category.allocatedAmount) * 100),
                    )
                  : 0
              const over = category.committedAmount > category.allocatedAmount
              const overAmount = category.committedAmount - category.allocatedAmount

              if (editingCategoryId === category.id) {
                return (
                  <div className="dash-budget-category" key={category.id}>
                    <div className="dash-budget-category__edit-row">
                      <input
                        type="text"
                        className="dash-field"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        className="dash-field"
                        value={editCategoryAmount}
                        onChange={(e) => setEditCategoryAmount(e.target.value)}
                      />
                      <button
                        type="button"
                        className="dash-btn dash-btn--primary"
                        onClick={() => handleSaveCategory(category.id)}
                        disabled={savingCategory || !editCategoryName.trim() || !editCategoryAmount}
                      >
                        שמרו
                      </button>
                      <button type="button" className="dash-btn" onClick={cancelEditCategory}>
                        ביטול
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div className="dash-budget-category" key={category.id}>
                  <div className="dash-budget-category__header">
                    <span className="dash-budget-category__name">{category.name}</span>
                    {over && (
                      <span className="dash-budget-category__over-badge">
                        חריגה ₪{overAmount.toLocaleString()}
                      </span>
                    )}
                    {/* One reading of the numbers, not two: the bar shows the
                        split, this shows the figures. */}
                    <span className="dash-budget-category__figures" title={COMMITTED_HINT}>
                      שולם ₪{category.actualAmount.toLocaleString()} · מחויב ₪
                      {category.committedAmount.toLocaleString()} · מתוקצב ₪
                      {category.allocatedAmount.toLocaleString()}
                    </span>
                    <div className="dash-budget-category__actions">
                      <button type="button" onClick={() => startEditCategory(category)}>
                        ערכו
                      </button>
                      <button type="button" onClick={() => handleDeleteCategory(category.id)}>
                        הסירו
                      </button>
                    </div>
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
