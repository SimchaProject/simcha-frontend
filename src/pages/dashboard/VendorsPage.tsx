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

// Same tile as OTHER_CATEGORY, with the budget field the merged tiles carry.
const OTHER_CATEGORY_TILE = { ...OTHER_CATEGORY, budgetId: null }

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

  // The budget for whichever category tile is open.
  const [tileBudgetDraft, setTileBudgetDraft] = useState('')
  const [savingTileBudget, setSavingTileBudget] = useState(false)

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


  // One list of categories for the whole page. The app had three separate
  // namings of the same idea - the preset add-tiles, the free-text
  // vendor.category, and the BudgetCategory rows - which is what put the same
  // categories on screen twice. They're merged by name here, so a tile is the
  // single place a category exists: what it's called, how many vendors are in
  // it, and what it's costing against its budget.
  const addTiles = useMemo(() => {
    const tiles: { id: string; label: string; icon: string; budgetId: string | null }[] = []

    // A budget category is the authoritative name for a category, and a
    // vendor linked to one belongs under it however its own free-text
    // category happens to be spelled. Without this, "אולם וקייטרינג" (the
    // budget), "אולם ואירוח" (the vendor) and "אולם / גן אירועים" (the
    // preset) each got a tile - three squares for one category.
    for (const category of summary?.categories ?? []) {
      tiles.push({
        id: `cat:${category.name}`,
        label: category.name,
        icon: iconForCategory(category.name) ?? '📁',
        budgetId: category.id,
      })
    }

    // Then whatever the couple has vendors in that isn't already covered by a
    // budget category above.
    const linkedIds = new Set(tiles.map((t) => t.budgetId))
    for (const vendor of vendors) {
      if (vendor.budgetCategoryId && linkedIds.has(vendor.budgetCategoryId)) continue
      if (tiles.some((t) => t.label === vendor.category)) continue
      tiles.push({
        id: `cat:${vendor.category}`,
        label: vendor.category,
        icon: iconForCategory(vendor.category) ?? '📁',
        budgetId: null,
      })
    }

    // With nothing set up yet the presets are the only way in, so they stand
    // in as the starting grid. Once the couple has their own categories, the
    // presets move behind the "אחר" tile instead of doubling the grid.
    if (tiles.length === 0) {
      return [...VENDOR_CATEGORY_PRESETS.map((p) => ({ ...p, budgetId: null })), OTHER_CATEGORY_TILE]
    }
    return [...tiles, OTHER_CATEGORY_TILE]
  }, [vendors, summary])

  const countForTile = (tile: { id: string; label: string; budgetId?: string | null }): number => {
    if (tile.id === OTHER_CATEGORY.id) {
      const known = new Set(addTiles.map((t) => t.label))
      return vendors.filter((v) => !known.has(v.category)).length
    }
    // Counted by the budget link where there is one, so a vendor whose own
    // category text differs still shows up under the category it's funded by.
    if (tile.budgetId) {
      return vendors.filter(
        (v) => v.budgetCategoryId === tile.budgetId || v.category === tile.label,
      ).length
    }
    return vendors.filter((v) => v.category === tile.label).length
  }

  const budgetForTile = (tile: { label: string }) =>
    summary?.categories.find((c) => c.name === tile.label) ?? null

  const activeTile = addTiles.find((t) => t.id === activeTileId) ?? null
  const activeBudget = activeTile ? budgetForTile(activeTile) : null

  // Matches the tile counts: a vendor funded by this category counts as being
  // in it even when its own free-text category is spelled differently.
  const visibleVendors = useMemo(() => {
    if (filter === ALL) return vendors
    const budgetId = summary?.categories.find((c) => c.name === filter)?.id ?? null
    return vendors.filter(
      (v) => v.category === filter || (budgetId !== null && v.budgetCategoryId === budgetId),
    )
  }, [vendors, filter, summary])

  const bookedCount = vendors.filter((v) => v.status === 'BOOKED' || v.status === 'PAID').length

  // Runs after the new card has actually rendered (ref is only set once
  // it's in the DOM), so this can't be inlined into handleAdd itself.
  useEffect(() => {
    if (!newlyAddedId) return
    newVendorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = setTimeout(() => setNewlyAddedId(null), 2000)
    return () => clearTimeout(timer)
  }, [newlyAddedId])

  // Clicking a category does the one thing "focus on this category" means:
  // the list below narrows to it, and its panel opens. The separate filter
  // chip row listed every category name a third time on the same page.
  const openTile = (tileId: string) => {
    if (activeTileId === tileId) {
      setActiveTileId(null)
      setFilter(ALL)
      return
    }
    setActiveTileId(tileId)
    const tile = addTiles.find((t) => t.id === tileId)
    setFilter(tile && tile.id !== OTHER_CATEGORY.id ? tile.label : ALL)
    setAddError(null)
    setNewVendorName('')
    setNewContactInfo('')
    setNewContractAmount('')
    setCustomCategory('')
    const existing = tile ? budgetForTile(tile) : null
    setTileBudgetDraft(existing ? String(existing.allocatedAmount) : '')
  }

  // One control for both cases: a category with no budget row yet gets one
  // created, an existing one gets updated. The couple doesn't have to know
  // which of those it is.
  const handleSaveTileBudget = async () => {
    if (!activeTile || !tileBudgetDraft) return
    setSavingTileBudget(true)
    try {
      if (activeBudget) {
        await budgetApi.updateCategory(wedding.id, activeBudget.id, {
          name: activeTile.label,
          allocatedAmount: Number(tileBudgetDraft),
        })
      } else {
        await budgetApi.createCategory(wedding.id, {
          name: activeTile.label,
          allocatedAmount: Number(tileBudgetDraft),
        })
      }
      loadBudget()
    } catch {
      setError('לא הצלחנו לשמור את התקציב לקטגוריה.')
    } finally {
      setSavingTileBudget(false)
    }
  }

  const handleRemoveTileBudget = async (categoryId: string) => {
    if (!window.confirm('להסיר את התקציב מהקטגוריה? הספקים עצמם יישארו.')) return
    await budgetApi.removeCategory(wedding.id, categoryId)
    setTileBudgetDraft('')
    loadBudget()
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
        {addTiles.map((tile) => {
          const count = countForTile(tile)
          const budget = budgetForTile(tile)
          const over = budget ? budget.committedAmount > budget.allocatedAmount : false
          const percent =
            budget && budget.allocatedAmount > 0
              ? Math.min(100, Math.round((budget.committedAmount / budget.allocatedAmount) * 100))
              : 0
          const paidPercent =
            budget && budget.allocatedAmount > 0
              ? Math.min(100, Math.round((budget.actualAmount / budget.allocatedAmount) * 100))
              : 0

          return (
            <button
              key={tile.id}
              type="button"
              className={`dash-vendor-tile${activeTileId === tile.id ? ' is-active' : ''}${
                budget ? ' has-budget' : ''
              }`}
              onClick={() => openTile(tile.id)}
            >
              <span className="dash-vendor-tile__icon" aria-hidden="true">
                {tile.icon}
              </span>
              <span className="dash-vendor-tile__label">{tile.label}</span>
              {count > 0 && <span className="dash-vendor-tile__count">{count}</span>}

              {/* The budget lives on the category itself rather than in a
                  second list further down the page. */}
              {budget && (
                <span className="dash-vendor-tile__budget">
                  <span className="dash-vendor-tile__bar">
                    <span
                      className="dash-vendor-tile__bar-fill dash-vendor-tile__bar-fill--committed"
                      style={{ width: `${percent}%` }}
                    />
                    <span
                      className={`dash-vendor-tile__bar-fill dash-vendor-tile__bar-fill--paid${
                        over ? ' is-over' : ''
                      }`}
                      style={{ width: `${paidPercent}%` }}
                    />
                  </span>
                  <span className={`dash-vendor-tile__figures${over ? ' is-over' : ''}`}>
                    {over
                      ? `חריגה ₪${(budget.committedAmount - budget.allocatedAmount).toLocaleString()}`
                      : `₪${budget.committedAmount.toLocaleString()} / ₪${budget.allocatedAmount.toLocaleString()}`}
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTile && (
        <div className="dash-panel">
          {/* Setting a category's budget happens on the category, in the same
              panel that adds a vendor to it - there's no second screen for
              it any more. "אחר" has no fixed name yet, so it has nothing to
              budget against until the vendor is created. */}
          {activeTile.id !== OTHER_CATEGORY.id && (
            <div className="dash-category-budget">
              <label htmlFor="tile-budget">תקציב ל{activeTile.label}</label>
              <input
                id="tile-budget"
                type="number"
                min="0"
                className="dash-field"
                placeholder="לא הוגדר"
                value={tileBudgetDraft}
                onChange={(e) => setTileBudgetDraft(e.target.value)}
              />
              <button
                type="button"
                className="dash-btn"
                onClick={handleSaveTileBudget}
                disabled={savingTileBudget || !tileBudgetDraft}
              >
                {activeBudget ? 'עדכנו תקציב' : 'הגדירו תקציב'}
              </button>
              {activeBudget && (
                <>
                  <span className="dash-category-budget__figures">
                    שולם ₪{activeBudget.actualAmount.toLocaleString()} · מחויב ₪
                    {activeBudget.committedAmount.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    className="dash-btn dash-category-budget__remove"
                    onClick={() => handleRemoveTileBudget(activeBudget.id)}
                  >
                    הסירו תקציב
                  </button>
                </>
              )}
            </div>
          )}

          <p className="dash-panel__title">
            {activeTile.icon} ספק חדש - {activeTile.label}
          </p>
          {/* The presets are the defaults a couple starts from - once they
              have categories of their own the grid shows those instead, so
              the full list lives here, one click from filling the name. */}
          {activeTile.id === OTHER_CATEGORY.id && (
            <div className="dash-budget-preset-row">
              {VENDOR_CATEGORY_PRESETS.filter(
                (preset) => !addTiles.some((t) => t.label === preset.label),
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="dash-budget-preset-chip"
                  onClick={() => setCustomCategory(preset.label)}
                >
                  <span aria-hidden="true">{preset.icon}</span> {preset.label}
                </button>
              ))}
            </div>
          )}

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

    </div>
  )
}
