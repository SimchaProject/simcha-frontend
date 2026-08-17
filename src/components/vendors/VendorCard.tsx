import { useRef, useState, type ChangeEvent } from 'react'
import { vendorsApi } from '../../api/vendors'
import type { Vendor, VendorStatus } from '../../types/vendors'
import type { BudgetCategory } from '../../types/budget'
import { VendorPaymentsPanel } from './VendorPaymentsPanel'

const STATUS_LABELS: Record<VendorStatus, string> = {
  CONTACTED: 'יצרנו קשר',
  QUOTED: 'קיבלנו הצעת מחיר',
  BOOKED: 'הוזמן',
  PAID: 'שולם',
}

const NO_CATEGORY = ''

interface VendorDraft {
  name: string
  category: string
  contactInfo: string
  totalContractAmount: string
  budgetCategoryId: string
}

function draftFromVendor(vendor: Vendor): VendorDraft {
  return {
    name: vendor.name,
    category: vendor.category,
    contactInfo: vendor.contactInfo ?? '',
    totalContractAmount: vendor.totalContractAmount != null ? String(vendor.totalContractAmount) : '',
    budgetCategoryId: vendor.budgetCategoryId ?? NO_CATEGORY,
  }
}

interface VendorCardProps {
  weddingId: string
  vendor: Vendor
  budgetCategories: BudgetCategory[]
  onUpdated: (vendor: Vendor) => void
  onDeleted: (vendorId: string) => void
}

export function VendorCard({ weddingId, vendor, budgetCategories, onUpdated, onDeleted }: VendorCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<VendorDraft>(() => draftFromVendor(vendor))
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const contractInputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(draftFromVendor(vendor))
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!draft.name.trim() || !draft.category.trim()) return
    try {
      const updated = await vendorsApi.update(weddingId, vendor.id, {
        name: draft.name.trim(),
        category: draft.category.trim(),
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
      <div className="dash-vendor-card dash-vendor-card--editing">
        <input
          type="text"
          value={draft.name}
          placeholder="שם הספק"
          onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="text"
          value={draft.category}
          placeholder="קטגוריה"
          onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
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
          <button type="button" onClick={saveEdit} disabled={!draft.name.trim() || !draft.category.trim()}>
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
    <div className="dash-vendor-card">
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
          <a href={vendorsApi.contractUrl(weddingId, vendor.id)} target="_blank" rel="noopener noreferrer">
            {vendor.contractFileName ?? 'החוזה'}
          </a>
        ) : null}
        <button type="button" onClick={() => contractInputRef.current?.click()}>
          {vendor.hasContract ? 'החלפת חוזה' : 'העלאת חוזה'}
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
}
