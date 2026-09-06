import { useEffect, useMemo, useRef, useState } from 'react'
import { useDashboard } from './dashboard-context'
import { vendorsApi } from '../../api/vendors'
import { budgetApi } from '../../api/budget'
import type { Vendor } from '../../types/vendors'
import type { BudgetCategory, BudgetSummary } from '../../types/budget'
import { VendorCard } from '../../components/vendors/VendorCard'
import { VENDOR_CATEGORY_PRESETS, OTHER_CATEGORY, iconForCategory } from '../../constants/vendorCategories'
import './vendors.css'
import './budget.css'

const ALL = '__all__'

const COMMITTED_HINT =
  'התקציב שנשאר לפני שמזמינים ספקים נוספים - אחרי הפחתת סכום החוזה של כל ספק שכבר סומן "הוזמן" או "שולם", גם אם עדיין לא הועבר תשלום בפועל. שונה מ"נותר לתשלום", שמחשב רק מה שכבר שולם בפועל.'

export function VendorsPage() {
  const { wedding } = useDashboard()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filter, setFilter] = useState<string>(ALL)

  // The couple picks a category tile before typing anything else - there's
  // no dropdown to notice or ignore, and no separate "add vendor" toggle:
  // the tile grid itself is always the way in, empty list or not.
  const [activeTileId, setActiveTileId] = useState<string | null>(null)
  const [customCategory, setCustomCategory] = useState('')
  const [newVendorName, setNewVendorName] = useState('')
  const [newContactInfo, setNewContactInfo] = useState('')
  const [newContractAmount, setNewContractAmount] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // The couple just added this vendor - scroll it into view and give it a
  // brief highlight instead of leaving them to notice it landed at the top.
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)
  const newVendorRef = useRef<HTMLDivElement>(null)

  // The budget lived on its own page, which meant a couple managed vendor
  // categories here and budget categories there - two lists of the same
  // thing, kept in step by hand. The money now sits with the vendors that
  // spend it.
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
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

  // Vendor edits change the money (a status moving to "הוזמן" changes what's
  // committed), so both refresh together and an older response can't
  // overwrite a newer one.
  const latestRequestId = useRef(0)
  const loadBudget = () => {
    const requestId = ++latestRequestId.current
    Promise.all([budgetApi.getSummary(wedding.id), budgetApi.listCategories(wedding.id)])
      .then(([result, categories]) => {
        if (requestId !== latestRequestId.current) return
        setSummary(result)
        setBudgetCategories(categories)
        setTotalDraft(String(result.totalAmount))
      })
      .catch(() => undefined)
  }

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
    loadBudget()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding.id])

  const addTiles = useMemo(() => [...VENDOR_CATEGORY_PRESETS, OTHER_CATEGORY], [])
  const presetLabels = useMemo(() => new Set(VENDOR_CATEGORY_PRESETS.map((p) => p.label)), [])

  const countForTile = (tileId: string): number => {
    if (tileId === OTHER_CATEGORY.id) {
      return vendors.filter((v) => !presetLabels.has(v.category)).length
    }
    const preset = VENDOR_CATEGORY_PRESETS.find((p) => p.id === tileId)
    return preset ? vendors.filter((v) => v.category === preset.label).length : 0
  }

  const activeTile = addTiles.find((t) => t.id === activeTileId) ?? null

  // Only categories the couple actually has vendors in - a filter row of
  // empty categories is a menu, not a filter (that's what the tiles above
  // are for).
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

  // Runs after the new card has actually rendered (ref is only set once
  // it's in the DOM), so this can't be inlined into handleAdd itself.
  useEffect(() => {
    if (!newlyAddedId) return
    newVendorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = setTimeout(() => setNewlyAddedId(null), 2000)
    return () => clearTimeout(timer)
  }, [newlyAddedId])

  const openTile = (tileId: string) => {
    if (activeTileId === tileId) {
      setActiveTileId(null)
      return
    }
    setActiveTileId(tileId)
    setAddError(null)
    setNewVendorName('')
    setNewContactInfo('')
    setNewContractAmount('')
    setCustomCategory('')
  }

  const handleAdd = async () => {
    if (!activeTile) return
    const category = activeTile.id === OTHER_CATEGORY.id ? customCategory.trim() : activeTile.label
    if (!newVendorName.trim() || !category) return

    setAdding(true)
    setAddError(null)
    try {
      const created = await vendorsApi.create(wedding.id, {
        name: newVendorName.trim(),
        category,
        contactInfo: newContactInfo.trim() || undefined,
        totalContractAmount: newContractAmount ? Number(newContractAmount) : undefined,
      })
      // At the top, not the bottom - a couple who just typed this in
      // shouldn't have to scroll to see it landed. If they're viewing a
      // filtered category the new vendor isn't in, switch to "הכל" so it's
      // not added somewhere they can't currently see.
      setVendors((prev) => [created, ...prev])
      setFilter((prev) => (prev !== ALL && prev !== created.category ? ALL : prev))
      setNewlyAddedId(created.id)
      setActiveTileId(null)
    } catch {
      setAddError('נא לוודא שהשם והקטגוריה תקינים.')
    } finally {
      setAdding(false)
    }
  }

  // A vendor's status or contract amount feeds straight into the committed
  // and paid figures above, so the money is refreshed alongside the card.
  const handleUpdated = (updated: Vendor) => {
    setVendors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
    loadBudget()
  }

  const handleDeleted = (vendorId: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== vendorId))
    loadBudget()
  }

  const handleSaveTotal = async () => {
    if (!totalDraft) return
    setSavingTotal(true)
    try {
      await budgetApi.updateBudget(wedding.id, { totalAmount: Number(totalDraft) })
      setEditingTotal(false)
      loadBudget()
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
      loadBudget()
    } catch {
      setError('לא הצלחנו להוסיף את הקטגוריה.')
    } finally {
      setAddingCategory(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('להסיר את הקטגוריה?')) return
    await budgetApi.removeCategory(wedding.id, categoryId)
    loadBudget()
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
      loadBudget()
    } catch {
      setError('לא הצלחנו לשמור את הקטגוריה.')
    } finally {
      setSavingCategory(false)
    }
  }

  // A vendor's category is edited right on its card (see VendorCard), not
  // through a separate "manage categories" screen - there's no category
  // entity to manage, just free text on each vendor. If other vendors
  // already share the category being changed, offer to move them all
  // together instead of silently splitting one off (this is also how a
  // typo'd or since-renamed custom category gets fixed everywhere at once).
  const handleCategoryChange = async (vendor: Vendor, newCategory: string) => {
    const siblings = vendors.filter((v) => v.id !== vendor.id && v.category === vendor.category)
    const alsoRenameSiblings =
      siblings.length > 0 &&
      window.confirm(
        `יש עוד ${siblings.length} ספקים בקטגוריית "${vendor.category}". לשנות גם אותם ל"${newCategory}"?`,
      )
    const targets = alsoRenameSiblings ? [vendor, ...siblings] : [vendor]
    const updated = await Promise.all(
      targets.map((v) => vendorsApi.update(wedding.id, v.id, { category: newCategory })),
    )
    setVendors((prev) => prev.map((v) => updated.find((u) => u.id === v.id) ?? v))
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
          <p className="dash-page-title">ספקים ותקציב</p>
          <p className="dash-page-sub">
            {vendors.length} ספקים · {bookedCount} כבר הוזמנו
            {summary && ` · תקציב כולל ₪${summary.totalAmount.toLocaleString()}`}
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

      {summary && (
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
      )}

      {/* The couple's way in, whether the list is empty or not - click a
          category, get a tiny scoped form, no dropdown to fumble with. */}
      <div className="dash-vendor-tiles">
        {addTiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className={`dash-vendor-tile${activeTileId === tile.id ? ' is-active' : ''}`}
            onClick={() => openTile(tile.id)}
          >
            <span className="dash-vendor-tile__icon" aria-hidden="true">
              {tile.icon}
            </span>
            <span className="dash-vendor-tile__label">{tile.label}</span>
            {countForTile(tile.id) > 0 && (
              <span className="dash-vendor-tile__count">{countForTile(tile.id)}</span>
            )}
          </button>
        ))}
      </div>

      {activeTile && (
        <div className="dash-panel">
          <p className="dash-panel__title">
            {activeTile.icon} ספק חדש - {activeTile.label}
          </p>
          <div className="dash-vendor-add-row">
            {activeTile.id === OTHER_CATEGORY.id && (
              <input
                type="text"
                className="dash-field"
                placeholder="שם הקטגוריה"
                autoFocus
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
            <input
              type="text"
              className="dash-field"
              placeholder="שם הספק"
              autoFocus={activeTile.id !== OTHER_CATEGORY.id}
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
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={handleAdd}
              disabled={
                adding ||
                !newVendorName.trim() ||
                (activeTile.id === OTHER_CATEGORY.id && !customCategory.trim())
              }
            >
              הוסיפו
            </button>
            <button type="button" className="dash-btn" onClick={() => setActiveTileId(null)}>
              ביטול
            </button>
          </div>
          {addError && <p className="dash-guest-error">{addError}</p>}
        </div>
      )}

      {vendors.length > 0 && (
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
                ref={vendor.id === newlyAddedId ? newVendorRef : undefined}
                highlighted={vendor.id === newlyAddedId}
                weddingId={wedding.id}
                vendor={vendor}
                budgetCategories={budgetCategories}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
                onCategoryChange={handleCategoryChange}
              />
            ))}
          </div>
        </>
      )}

      {/* Budget categories, moved here from the budget page. A vendor is
          linked to one on its own card, so the allocation and the spending
          that fills it are now on the same screen. */}
      {summary && (
        <div className="dash-card dash-budget-categories-card">
          <div className="dash-card__header">
            <p className="dash-card__title">קטגוריות תקציב</p>
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
                    ? Math.min(
                        100,
                        Math.round((category.actualAmount / category.allocatedAmount) * 100),
                      )
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
                          disabled={
                            savingCategory || !editCategoryName.trim() || !editCategoryAmount
                          }
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
      )}
    </div>
  )
}
