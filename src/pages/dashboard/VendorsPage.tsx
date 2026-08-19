import { useEffect, useMemo, useState } from 'react'
import { useDashboard } from './dashboard-context'
import { vendorsApi } from '../../api/vendors'
import { budgetApi } from '../../api/budget'
import type { Vendor } from '../../types/vendors'
import type { BudgetCategory } from '../../types/budget'
import { VendorCard } from '../../components/vendors/VendorCard'
import { VENDOR_CATEGORY_PRESETS, iconForCategory } from '../../constants/vendorCategories'
import './vendors.css'

const ALL = '__all__'
const CUSTOM = '__custom__'
const NO_BUDGET_CATEGORY = ''

export function VendorsPage() {
  const { wedding } = useDashboard()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filter, setFilter] = useState<string>(ALL)
  const [showAdd, setShowAdd] = useState(false)
  const [categoryChoice, setCategoryChoice] = useState(VENDOR_CATEGORY_PRESETS[0].label)
  const [customCategory, setCustomCategory] = useState('')
  const [newVendorName, setNewVendorName] = useState('')
  const [newContactInfo, setNewContactInfo] = useState('')
  const [newContractAmount, setNewContractAmount] = useState('')
  const [newBudgetCategoryId, setNewBudgetCategoryId] = useState(NO_BUDGET_CATEGORY)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    vendorsApi
      .list(wedding.id)
      .then((result) => {
        if (cancelled) return
        setVendors(result)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError('לא הצלחנו לטעון את רשימת הספקים.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [wedding.id])

  useEffect(() => {
    budgetApi.listCategories(wedding.id).then(setBudgetCategories).catch(() => undefined)
  }, [wedding.id])

  // Only categories the couple actually has vendors in - a filter row of
  // empty categories is a menu, not a filter.
  const usedCategories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const vendor of vendors) {
      counts.set(vendor.category, (counts.get(vendor.category) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [vendors])

  const visibleVendors = useMemo(
    () => (filter === ALL ? vendors : vendors.filter((v) => v.category === filter)),
    [vendors, filter],
  )

  const bookedCount = vendors.filter((v) => v.status === 'BOOKED' || v.status === 'PAID').length

  const handleAdd = async () => {
    const category = categoryChoice === CUSTOM ? customCategory.trim() : categoryChoice
    if (!newVendorName.trim() || !category) return

    setAdding(true)
    setAddError(null)
    try {
      const created = await vendorsApi.create(wedding.id, {
        name: newVendorName.trim(),
        category,
        contactInfo: newContactInfo.trim() || undefined,
        totalContractAmount: newContractAmount ? Number(newContractAmount) : undefined,
        budgetCategoryId: newBudgetCategoryId || null,
      })
      setVendors((prev) => [...prev, created])
      setNewVendorName('')
      setNewContactInfo('')
      setNewContractAmount('')
      setCustomCategory('')
      setShowAdd(false)
    } catch {
      setAddError('נא לוודא שהשם והקטגוריה תקינים.')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdated = (updated: Vendor) => {
    setVendors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
  }

  const handleDeleted = (vendorId: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== vendorId))
  }

  if (loading) {
    return (
      <div className="dash-vendors">
        <div className="dash-page-header">
          <p className="dash-page-title">ספקים</p>
        </div>
        <div className="dash-page-loading">
          <span className="dash-loading__spinner" aria-hidden="true" />
        </div>
      </div>
    )
  }

  return (
    <div className="dash-vendors">
      <div className="dash-page-header dash-page-header--row">
        <div>
          <p className="dash-page-title">ספקים</p>
          <p className="dash-page-sub">
            {vendors.length} ספקים · {bookedCount} כבר הוזמנו
          </p>
        </div>
        <div className="dash-page-actions">
          <button
            type="button"
            className="dash-btn dash-btn--primary"
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? 'סגירה' : '+ הוספת ספק'}
          </button>
        </div>
      </div>

      {error && <p className="dash-guest-error">{error}</p>}

      {showAdd && (
        <div className="dash-panel">
          <p className="dash-panel__title">ספק חדש</p>
          <div className="dash-vendor-add-row">
            <select
              className="dash-field"
              value={categoryChoice}
              onChange={(e) => setCategoryChoice(e.target.value)}
            >
              {VENDOR_CATEGORY_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.label}>
                  {preset.icon} {preset.label}
                </option>
              ))}
              <option value={CUSTOM}>קטגוריה אחרת...</option>
            </select>
            {categoryChoice === CUSTOM && (
              <input
                type="text"
                className="dash-field"
                placeholder="שם הקטגוריה"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
            <input
              type="text"
              className="dash-field"
              placeholder="שם הספק"
              autoFocus
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
            />
            <input
              type="text"
              className="dash-field"
              placeholder="פרטי קשר (לא חובה)"
              value={newContactInfo}
              onChange={(e) => setNewContactInfo(e.target.value)}
            />
            <input
              type="number"
              min="0"
              className="dash-field"
              placeholder="סכום חוזה (לא חובה)"
              value={newContractAmount}
              onChange={(e) => setNewContractAmount(e.target.value)}
            />
            <select
              className="dash-field"
              value={newBudgetCategoryId}
              onChange={(e) => setNewBudgetCategoryId(e.target.value)}
            >
              <option value={NO_BUDGET_CATEGORY}>ללא קטגוריית תקציב</option>
              {budgetCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={handleAdd}
              disabled={
                adding || !newVendorName.trim() || (categoryChoice === CUSTOM && !customCategory.trim())
              }
            >
              הוסיפו
            </button>
          </div>
          {addError && <p className="dash-guest-error">{addError}</p>}
        </div>
      )}

      {vendors.length === 0 ? (
        <p className="dash-page-sub">עדיין אין ספקים ברשימה. הוסיפו את הראשון למעלה.</p>
      ) : (
        <>
          <div className="dash-vendor-filters">
            <button
              type="button"
              className={`dash-vendor-filter${filter === ALL ? ' is-active' : ''}`}
              onClick={() => setFilter(ALL)}
            >
              הכל <span className="dash-vendor-filter__count">{vendors.length}</span>
            </button>
            {usedCategories.map(([category, count]) => (
              <button
                key={category}
                type="button"
                className={`dash-vendor-filter${filter === category ? ' is-active' : ''}`}
                onClick={() => setFilter(category)}
              >
                {iconForCategory(category) && (
                  <span aria-hidden="true">{iconForCategory(category)}</span>
                )}{' '}
                {category}{' '}
                <span className="dash-vendor-filter__count">{count}</span>
              </button>
            ))}
          </div>

          {/* One grid for every visible vendor. The old layout gave each
              category its own auto-fill grid, so a category with a single
              vendor rendered that card at a quarter width with three empty
              tracks beside it. */}
          <div className="dash-vendor-cards">
            {visibleVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                weddingId={wedding.id}
                vendor={vendor}
                budgetCategories={budgetCategories}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
