import { useEffect, useMemo, useRef, useState } from 'react'
import { useDashboard } from './dashboard-context'
import { vendorsApi } from '../../api/vendors'
import { budgetApi } from '../../api/budget'
import type { Vendor } from '../../types/vendors'
import type { BudgetCategory } from '../../types/budget'
import { VendorCard } from '../../components/vendors/VendorCard'
import { VENDOR_CATEGORY_PRESETS, OTHER_CATEGORY, iconForCategory } from '../../constants/vendorCategories'
import './vendors.css'

const ALL = '__all__'

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

  // Only fetched for VendorCard's own edit form, where a couple can link a
  // vendor to a budget category if they want to - never asked for up front
  // when just adding a vendor, since that's two categorization decisions at
  // once for no reason at add time.
  useEffect(() => {
    budgetApi.listCategories(wedding.id).then(setBudgetCategories).catch(() => undefined)
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

  const handleUpdated = (updated: Vendor) => {
    setVendors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
  }

  const handleDeleted = (vendorId: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== vendorId))
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
      <div className="dash-page-header">
        <p className="dash-page-title">ספקים</p>
        <p className="dash-page-sub">
          {vendors.length} ספקים · {bookedCount} כבר הוזמנו
        </p>
      </div>

      {error && <p className="dash-guest-error">{error}</p>}

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
    </div>
  )
}
