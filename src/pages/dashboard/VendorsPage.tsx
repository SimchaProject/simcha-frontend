import { useEffect, useState } from 'react'
import { useDashboard } from './dashboard-context'
import { vendorsApi } from '../../api/vendors'
import { budgetApi } from '../../api/budget'
import type { Vendor } from '../../types/vendors'
import type { BudgetCategory } from '../../types/budget'
import { VendorCard } from '../../components/vendors/VendorCard'
import { VENDOR_CATEGORY_PRESETS, OTHER_CATEGORY, iconForCategory } from '../../constants/vendorCategories'
import './vendors.css'

export function VendorsPage() {
  const { wedding } = useDashboard()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTileId, setActiveTileId] = useState<string | null>(null)
  const [customCategory, setCustomCategory] = useState('')
  const [newVendorName, setNewVendorName] = useState('')
  const [newContactInfo, setNewContactInfo] = useState('')
  const [newContractAmount, setNewContractAmount] = useState('')
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

  const countForCategory = (label: string) => vendors.filter((v) => v.category === label).length

  const activeTile = [...VENDOR_CATEGORY_PRESETS, OTHER_CATEGORY].find((t) => t.id === activeTileId) ?? null

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
    const category = activeTile.id === 'other' ? customCategory.trim() : activeTile.label
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
      setVendors((prev) => [...prev, created])
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

  // Group existing vendors by their category string - vendors added via a
  // preset tile share that tile's exact label, so they group together
  // automatically; custom ("אחר") categories just group under whatever the
  // couple typed, each becoming its own section.
  const categoryOrder = [...VENDOR_CATEGORY_PRESETS.map((p) => p.label), ...new Set(vendors.map((v) => v.category))]
  const seenCategories = new Set<string>()
  const orderedCategories = categoryOrder.filter((c) => {
    if (seenCategories.has(c)) return false
    seenCategories.add(c)
    return true
  })

  return (
    <div className="dash-vendors">
      <div className="dash-page-header">
        <p className="dash-page-title">ספקים</p>
        <p className="dash-page-sub">{vendors.length} ספקים ברשימה</p>
      </div>

      {error && <p className="dash-guest-error">{error}</p>}

      <div className="dash-vendor-categories-grid">
        {[...VENDOR_CATEGORY_PRESETS, OTHER_CATEGORY].map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`dash-vendor-category-tile${activeTileId === preset.id ? ' is-active' : ''}`}
            onClick={() => openTile(preset.id)}
          >
            <span className="dash-vendor-category-tile__icon">{preset.icon}</span>
            <span className="dash-vendor-category-tile__label">{preset.label}</span>
            {preset.id !== 'other' && countForCategory(preset.label) > 0 && (
              <span className="dash-vendor-category-tile__count">{countForCategory(preset.label)}</span>
            )}
          </button>
        ))}
      </div>

      {activeTile && (
        <div className="dash-vendor-add-panel">
          <p className="dash-vendor-add-panel__title">
            {activeTile.icon} הוספת ספק{activeTile.id !== 'other' ? ` - ${activeTile.label}` : ''}
          </p>
          <div className="dash-vendor-add-panel__row">
            {activeTile.id === 'other' && (
              <input
                type="text"
                placeholder="שם הקטגוריה"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
            <input
              type="text"
              placeholder="שם הספק"
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
            />
            <input
              type="text"
              placeholder="פרטי קשר (לא חובה)"
              value={newContactInfo}
              onChange={(e) => setNewContactInfo(e.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="סכום חוזה (לא חובה)"
              value={newContractAmount}
              onChange={(e) => setNewContractAmount(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={
                adding || !newVendorName.trim() || (activeTile.id === 'other' && !customCategory.trim())
              }
            >
              + הוסיפו
            </button>
          </div>
          {addError && <p className="dash-guest-error">{addError}</p>}
        </div>
      )}

      {vendors.length === 0 ? (
        <p className="dash-page-sub">עדיין אין ספקים ברשימה. בחרו קטגוריה למעלה כדי להוסיף את הראשון.</p>
      ) : (
        orderedCategories.map((category) => {
          const vendorsInCategory = vendors.filter((v) => v.category === category)
          if (vendorsInCategory.length === 0) return null
          return (
            <div className="dash-vendor-group" key={category}>
              <p className="dash-vendor-group__title">
                <span>{iconForCategory(category)}</span> {category} ({vendorsInCategory.length})
              </p>
              <div className="dash-vendor-cards">
                {vendorsInCategory.map((vendor) => (
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
            </div>
          )
        })
      )}
    </div>
  )
}
