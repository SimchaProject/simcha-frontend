import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useDashboard } from './dashboard-context'
import { vendorsApi } from '../../api/vendors'
import { budgetApi } from '../../api/budget'
import type { Vendor, VendorStatus } from '../../types/vendors'
import type { BudgetCategory } from '../../types/budget'
import { VendorPaymentsPanel } from '../../components/vendors/VendorPaymentsPanel'
import './vendors.css'

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

const emptyDraft: VendorDraft = {
  name: '',
  category: '',
  contactInfo: '',
  totalContractAmount: '',
  budgetCategoryId: NO_CATEGORY,
}

function vendorPayload(draft: VendorDraft) {
  return {
    name: draft.name.trim(),
    category: draft.category.trim(),
    contactInfo: draft.contactInfo.trim() || undefined,
    totalContractAmount: draft.totalContractAmount ? Number(draft.totalContractAmount) : undefined,
    budgetCategoryId: draft.budgetCategoryId || null,
  }
}

export function VendorsPage() {
  const { wedding } = useDashboard()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newVendor, setNewVendor] = useState<VendorDraft>(emptyDraft)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<VendorDraft>(emptyDraft)

  const contractInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null)

  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null)

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
    budgetApi.listCategories(wedding.id).then(setCategories).catch(() => undefined)
  }, [wedding.id])

  const handleAdd = async () => {
    if (!newVendor.name.trim() || !newVendor.category.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const created = await vendorsApi.create(wedding.id, vendorPayload(newVendor))
      setVendors((prev) => [...prev, created])
      setNewVendor(emptyDraft)
    } catch {
      setAddError('נא לוודא שהשם והקטגוריה תקינים.')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (vendor: Vendor) => {
    setEditingId(vendor.id)
    setEditDraft({
      name: vendor.name,
      category: vendor.category,
      contactInfo: vendor.contactInfo ?? '',
      totalContractAmount: vendor.totalContractAmount != null ? String(vendor.totalContractAmount) : '',
      budgetCategoryId: vendor.budgetCategoryId ?? NO_CATEGORY,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(emptyDraft)
  }

  const saveEdit = async (vendorId: string) => {
    try {
      const updated = await vendorsApi.update(wedding.id, vendorId, vendorPayload(editDraft))
      setVendors((prev) => prev.map((v) => (v.id === vendorId ? updated : v)))
      cancelEdit()
    } catch {
      setError('לא הצלחנו לשמור את השינוי.')
    }
  }

  const handleStatusChange = async (vendorId: string, status: VendorStatus) => {
    const updated = await vendorsApi.update(wedding.id, vendorId, { status })
    setVendors((prev) => prev.map((v) => (v.id === vendorId ? updated : v)))
  }

  const handleDelete = async (vendorId: string) => {
    if (!window.confirm('להסיר את הספק מהרשימה?')) return
    await vendorsApi.remove(wedding.id, vendorId)
    setVendors((prev) => prev.filter((v) => v.id !== vendorId))
  }

  const triggerContractUpload = (vendorId: string) => {
    setUploadTargetId(vendorId)
    contractInputRef.current?.click()
  }

  const handleContractFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !uploadTargetId) return
    const vendorId = uploadTargetId
    setUploadTargetId(null)
    try {
      const updated = await vendorsApi.uploadContract(wedding.id, vendorId, file)
      setVendors((prev) => prev.map((v) => (v.id === vendorId ? updated : v)))
    } catch {
      setError('לא הצלחנו להעלות את החוזה.')
    }
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
        <p className="dash-page-sub">{vendors.length} ספקים ברשימה</p>
      </div>

      <div className="dash-vendor-add-row">
        <input
          type="text"
          placeholder="שם הספק"
          value={newVendor.name}
          onChange={(e) => setNewVendor((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="text"
          placeholder="קטגוריה"
          value={newVendor.category}
          onChange={(e) => setNewVendor((prev) => ({ ...prev, category: e.target.value }))}
        />
        <input
          type="text"
          placeholder="פרטי קשר (לא חובה)"
          value={newVendor.contactInfo}
          onChange={(e) => setNewVendor((prev) => ({ ...prev, contactInfo: e.target.value }))}
        />
        <input
          type="number"
          min="0"
          placeholder="סכום חוזה (לא חובה)"
          value={newVendor.totalContractAmount}
          onChange={(e) => setNewVendor((prev) => ({ ...prev, totalContractAmount: e.target.value }))}
        />
        <button type="button" onClick={handleAdd} disabled={adding || !newVendor.name.trim() || !newVendor.category.trim()}>
          + הוסיפו ספק
        </button>
      </div>
      {addError && <p className="dash-guest-error">{addError}</p>}
      {error && <p className="dash-guest-error">{error}</p>}

      <input
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        ref={contractInputRef}
        style={{ display: 'none' }}
        onChange={handleContractFileChange}
      />

      {vendors.length === 0 ? (
        <p className="dash-page-sub">עדיין אין ספקים ברשימה. הוסיפו את הראשון למעלה.</p>
      ) : (
        <table className="dash-vendor-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>קטגוריה</th>
              <th>פרטי קשר</th>
              <th>סכום חוזה</th>
              <th>קטגוריית תקציב</th>
              <th>סטטוס</th>
              <th>חוזה</th>
              <th>תשלומים</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {vendors.flatMap((vendor) => [
              editingId === vendor.id ? (
                <tr key={vendor.id}>
                  <td>
                    <input
                      type="text"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editDraft.category}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, category: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editDraft.contactInfo}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, contactInfo: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={editDraft.totalContractAmount}
                      onChange={(e) =>
                        setEditDraft((prev) => ({ ...prev, totalContractAmount: e.target.value }))
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={editDraft.budgetCategoryId}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, budgetCategoryId: e.target.value }))}
                    >
                      <option value={NO_CATEGORY}>ללא קטגוריה</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td colSpan={4}>
                    <div className="dash-vendor-table__actions">
                      <button type="button" onClick={() => saveEdit(vendor.id)}>
                        שמרו
                      </button>
                      <button type="button" onClick={cancelEdit}>
                        ביטול
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={vendor.id}>
                  <td>{vendor.name}</td>
                  <td>{vendor.category}</td>
                  <td>{vendor.contactInfo ?? '—'}</td>
                  <td>
                    {vendor.totalContractAmount != null ? `₪${vendor.totalContractAmount.toLocaleString()}` : '—'}
                  </td>
                  <td>
                    {categories.find((c) => c.id === vendor.budgetCategoryId)?.name ?? '—'}
                  </td>
                  <td>
                    <select
                      className={`dash-vendor-status-select dash-vendor-status-select--${vendor.status.toLowerCase()}`}
                      value={vendor.status}
                      onChange={(e) => handleStatusChange(vendor.id, e.target.value as VendorStatus)}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="dash-vendor-table__actions">
                      {vendor.hasContract && (
                        <a
                          href={vendorsApi.contractUrl(wedding.id, vendor.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {vendor.contractFileName ?? 'הצגה'}
                        </a>
                      )}
                      <button type="button" onClick={() => triggerContractUpload(vendor.id)}>
                        {vendor.hasContract ? 'החלפה' : 'העלאה'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setExpandedVendorId((prev) => (prev === vendor.id ? null : vendor.id))}
                    >
                      {expandedVendorId === vendor.id ? 'הסתירו' : 'הצגה'}
                    </button>
                  </td>
                  <td>
                    <div className="dash-vendor-table__actions">
                      <button type="button" onClick={() => startEdit(vendor)}>
                        ערכו
                      </button>
                      <button type="button" onClick={() => handleDelete(vendor.id)}>
                        הסירו
                      </button>
                    </div>
                  </td>
                </tr>
              ),
              expandedVendorId === vendor.id && (
                <tr key={`${vendor.id}-payments`}>
                  <td colSpan={9}>
                    <VendorPaymentsPanel weddingId={wedding.id} vendorId={vendor.id} />
                  </td>
                </tr>
              ),
            ])}
          </tbody>
        </table>
      )}
    </div>
  )
}
