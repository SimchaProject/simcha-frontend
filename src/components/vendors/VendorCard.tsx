import { forwardRef, useRef, useState, type ChangeEvent } from 'react'
import { vendorsApi } from '../../api/vendors'
import type { Vendor, VendorStatus } from '../../types/vendors'
import type { BudgetCategory } from '../../types/budget'
import { VendorPaymentsPanel } from './VendorPaymentsPanel'
import { VENDOR_CATEGORY_PRESETS, iconForCategory } from '../../constants/vendorCategories'

const STATUS_LABELS: Record<VendorStatus, string> = {
  CONTACTED: 'יצרנו קשר',
  QUOTED: 'קיבלנו הצעת מחיר',
  BOOKED: 'הוזמן',
  PAID: 'שולם',
}

const NO_CATEGORY = ''
const CUSTOM = '__custom__'

interface VendorDraft {
  name: string
  contactInfo: string
  totalContractAmount: string
  budgetCategoryId: string
}

function draftFromVendor(vendor: Vendor): VendorDraft {
  return {
    name: vendor.name,
    contactInfo: vendor.contactInfo ?? '',
    totalContractAmount: vendor.totalContractAmount != null ? String(vendor.totalContractAmount) : '',
    budgetCategoryId: vendor.budgetCategoryId ?? NO_CATEGORY,
  }
}

interface VendorCardProps {
  weddingId: string
  vendor: Vendor
  budgetCategories: BudgetCategory[]
  highlighted?: boolean
  onUpdated: (vendor: Vendor) => void
  onDeleted: (vendorId: string) => void
  onCategoryChange: (vendor: Vendor, newCategory: string) => Promise<void>
}

export const VendorCard = forwardRef<HTMLDivElement, VendorCardProps>(function VendorCard(
  { weddingId, vendor, budgetCategories, highlighted, onUpdated, onDeleted, onCategoryChange },
  ref,
) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<VendorDraft>(() => draftFromVendor(vendor))
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  // The category has its own small, always-visible editor right on the
  // card - not buried inside the generic "ערכו" form - since that's the one
  // field a couple is most likely to want to fix after the fact (a typo,
  // or moving a vendor once a more specific preset exists).
  const [editingCategory, setEditingCategory] = useState(false)
  const [categoryChoice, setCategoryChoice] = useState(vendor.category)
  const [customCategoryDraft, setCustomCategoryDraft] = useState(vendor.category)
  const [categorySaving, setCategorySaving] = useState(false)

  const contractInputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(draftFromVendor(vendor))
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!draft.name.trim()) return
    try {
      const updated = await vendorsApi.update(weddingId, vendor.id, {
        name: draft.name.trim(),
        contactInfo: draft.contactInfo.trim() || undefined,
        totalContractAmount: draft.totalContractAmount ? Number(draft.totalContractAmount) : undefined,
        budgetCategoryId: draft.budgetCategoryId || null,
      })
      onUpdated(updated)
      setEditing(false)
    } catch {
      setError('לא הצלחנו לשמור את השינוי.')
    }
  }

  const isPresetCategory = VENDOR_CATEGORY_PRESETS.some((p) => p.label === vendor.category)

  const startCategoryEdit = () => {
    setCategoryChoice(isPresetCategory ? vendor.category : CUSTOM)
    setCustomCategoryDraft(vendor.category)
    setEditingCategory(true)
  }

  const saveCategory = async () => {
    const next = categoryChoice === CUSTOM ? customCategoryDraft.trim() : categoryChoice
    if (!next || next === vendor.category) {
      setEditingCategory(false)
      return
    }
    setCategorySaving(true)
    try {
      await onCategoryChange(vendor, next)
      setEditingCategory(false)
    } catch {
      setError('לא הצלחנו לשנות את הקטגוריה.')
    } finally {
      setCategorySaving(false)
    }
  }

  const handleStatusChange = async (status: VendorStatus) => {
    const updated = await vendorsApi.update(weddingId, vendor.id, { status })
    onUpdated(updated)
  }

  const handleDelete = async () => {
    if (!window.confirm('להסיר את הספק מהרשימה?')) return
    await vendorsApi.remove(weddingId, vendor.id)
    onDeleted(vendor.id)
  }

  const handleContractFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const updated = await vendorsApi.uploadContract(weddingId, vendor.id, file)
      onUpdated(updated)
    } catch {
      setError('לא הצלחנו להעלות את החוזה.')
    }
  }

  if (editing) {
    return (
      <div className="dash-vendor-card dash-vendor-card--editing" ref={ref}>
        <input
          type="text"
          value={draft.name}
          placeholder="שם הספק"
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="text"
          value={draft.contactInfo}
          placeholder="פרטי קשר"
          onChange={(e) => setDraft((prev) => ({ ...prev, contactInfo: e.target.value }))}
        />
        <input
          type="number"
          min="0"
          value={draft.totalContractAmount}
          placeholder="סכום חוזה"
          onChange={(e) => setDraft((prev) => ({ ...prev, totalContractAmount: e.target.value }))}
        />
        <select
          value={draft.budgetCategoryId}
          onChange={(e) => setDraft((prev) => ({ ...prev, budgetCategoryId: e.target.value }))}
        >
          <option value={NO_CATEGORY}>ללא קטגוריית תקציב</option>
          {budgetCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {error && <p className="dash-guest-error">{error}</p>}
        <div className="dash-vendor-card__actions">
          <button type="button" onClick={saveEdit} disabled={!draft.name.trim()}>
            שמרו
          </button>
          <button type="button" onClick={() => setEditing(false)}>
            ביטול
          </button>
        </div>
      </div>
    )
  }

  return (
    // The payments table needs more room than a card-width column has, so an
    // open card takes the whole row instead of letting the table spill over
    // its neighbour.
    <div
      ref={ref}
      className={`dash-vendor-card${expanded ? ' dash-vendor-card--expanded' : ''}${
        highlighted ? ' dash-vendor-card--highlighted' : ''
      }`}
    >
      <input
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        ref={contractInputRef}
        style={{ display: 'none' }}
        onChange={handleContractFileChange}
      />
      <div className="dash-vendor-card__header">
        <p className="dash-vendor-card__name">{vendor.name}</p>
        <select
          className={`dash-vendor-status-select dash-vendor-status-select--${vendor.status.toLowerCase()}`}
          value={vendor.status}
          onChange={(e) => handleStatusChange(e.target.value as VendorStatus)}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* The list is no longer grouped under category headings, so the card
          carries its own category - and it's its own small editor, since
          this is the field couples most often want to fix after the fact. */}
      {editingCategory ? (
        <div className="dash-vendor-card__category-edit">
          <select value={categoryChoice} onChange={(e) => setCategoryChoice(e.target.value)} autoFocus>
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
              placeholder="שם הקטגוריה"
              value={customCategoryDraft}
              onChange={(e) => setCustomCategoryDraft(e.target.value)}
            />
          )}
          <button
            type="button"
            onClick={saveCategory}
            disabled={categorySaving || (categoryChoice === CUSTOM && !customCategoryDraft.trim())}
          >
            שמרו
          </button>
          <button type="button" onClick={() => setEditingCategory(false)}>
            ביטול
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="dash-vendor-card__category"
          onClick={startCategoryEdit}
          title="לחצו לשינוי הקטגוריה"
        >
          {iconForCategory(vendor.category) && (
            <span aria-hidden="true">{iconForCategory(vendor.category)} </span>
          )}
          {vendor.category}
          <span className="dash-vendor-card__category-edit-hint" aria-hidden="true">
            ✎
          </span>
        </button>
      )}

      {vendor.contactInfo && <p className="dash-vendor-card__detail">{vendor.contactInfo}</p>}
      {vendor.totalContractAmount != null && (
        <p className="dash-vendor-card__detail">חוזה: ₪{vendor.totalContractAmount.toLocaleString()}</p>
      )}
      {vendor.budgetCategoryId && (
        <p className="dash-vendor-card__detail">
          קטגוריית תקציב: {budgetCategories.find((c) => c.id === vendor.budgetCategoryId)?.name ?? '—'}
        </p>
      )}
      {error && <p className="dash-guest-error">{error}</p>}

      <div className="dash-vendor-card__actions">
        {vendor.hasContract ? (
          <a
            className="dash-vendor-card__contract"
            href={vendorsApi.contractUrl(weddingId, vendor.id)}
            target="_blank"
            rel="noopener noreferrer"
            title={vendor.contractFileName ?? undefined}
          >
            {vendor.contractFileName ?? 'החוזה'}
          </a>
        ) : null}
        <button type="button" onClick={() => contractInputRef.current?.click()}>
          {vendor.hasContract ? 'החלפה' : 'חוזה'}
        </button>
        <button type="button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'הסתירו תשלומים' : 'תשלומים'}
        </button>
        <button type="button" onClick={startEdit}>
          ערכו
        </button>
        <button type="button" onClick={handleDelete}>
          הסירו
        </button>
      </div>

      {expanded && <VendorPaymentsPanel weddingId={weddingId} vendorId={vendor.id} />}
    </div>
  )
})
