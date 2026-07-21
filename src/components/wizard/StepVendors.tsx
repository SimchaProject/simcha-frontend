import type { VendorDraft, WizardData } from './types'

interface StepVendorsProps {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
  onSkip: () => void
}

function newVendor(): VendorDraft {
  return { id: crypto.randomUUID(), name: '', category: '', contactInfo: '' }
}

export function StepVendors({ data, onChange, onSkip }: StepVendorsProps) {
  const updateVendor = (id: string, patch: Partial<VendorDraft>) => {
    onChange({ vendors: data.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)) })
  }

  const removeVendor = (id: string) => {
    onChange({ vendors: data.vendors.filter((v) => v.id !== id) })
  }

  const addVendor = () => {
    onChange({ vendors: [...data.vendors, newVendor()] })
  }

  return (
    <div className="wizard-step">
      <p className="wizard-step__title">ספקים</p>
      <p className="wizard-step__sub">אפשר לדלג ולהוסיף את זה מאוחר יותר מלוח הבקרה</p>
      <button type="button" className="wizard-skip-link" onClick={onSkip}>
        דלגו לעכשיו, אוסיף מאוחר יותר מלוח הבקרה
      </button>

      <div className="wizard-rows">
        {data.vendors.map((vendor) => (
          <div className="wizard-row wizard-row--vendor" key={vendor.id}>
            <input
              type="text"
              value={vendor.name}
              onChange={(e) => updateVendor(vendor.id, { name: e.target.value })}
              placeholder="שם הספק"
              className="wizard-row__name"
            />
            <input
              type="text"
              value={vendor.category}
              onChange={(e) => updateVendor(vendor.id, { category: e.target.value })}
              placeholder="קטגוריה (לדוגמה: צילום)"
              className="wizard-row__category"
            />
            <input
              type="text"
              value={vendor.contactInfo}
              onChange={(e) => updateVendor(vendor.id, { contactInfo: e.target.value })}
              placeholder="פרטי קשר"
              className="wizard-row__contact"
            />
            <button
              type="button"
              className="wizard-row__remove"
              onClick={() => removeVendor(vendor.id)}
              aria-label="הסירו ספק"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="wizard-add-row" onClick={addVendor}>
          + הוסיפו ספק
        </button>
      </div>
    </div>
  )
}
