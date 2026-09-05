import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { vendorsApi } from '../../api/vendors'
import { DatePicker } from '../ui/DatePicker'
import type { PaymentType, VendorPayment } from '../../types/vendors'

const TYPE_LABELS: Record<PaymentType, string> = {
  DEPOSIT: 'מקדמה',
  INSTALLMENT: 'תשלום',
  FINAL: 'תשלום סופי',
}

interface VendorPaymentsPanelProps {
  weddingId: string
  vendorId: string
}

export function VendorPaymentsPanel({ weddingId, vendorId }: VendorPaymentsPanelProps) {
  const [payments, setPayments] = useState<VendorPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newType, setNewType] = useState<PaymentType>('DEPOSIT')
  const [newAmount, setNewAmount] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [newPaidDate, setNewPaidDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [adding, setAdding] = useState(false)

  const receiptInputRef = useRef<HTMLInputElement>(null)
  const [receiptTargetId, setReceiptTargetId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    vendorsApi
      .listPayments(weddingId, vendorId)
      .then((result) => {
        if (cancelled) return
        setPayments(result)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError('לא הצלחנו לטעון את התשלומים.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [weddingId, vendorId])

  const handleAdd = async () => {
    if (!newAmount) return
    setAdding(true)
    setError(null)
    try {
      const created = await vendorsApi.createPayment(weddingId, vendorId, {
        paymentType: newType,
        amount: Number(newAmount),
        dueDate: !alreadyPaid && newDueDate ? newDueDate : undefined,
        status: alreadyPaid ? 'PAID' : undefined,
        paidDate: alreadyPaid ? newPaidDate : undefined,
      })
      setPayments((prev) => [...prev, created])
      setNewAmount('')
      setNewDueDate('')
      setAlreadyPaid(false)
      setNewPaidDate(new Date().toISOString().slice(0, 10))
    } catch {
      setError('לא הצלחנו להוסיף את התשלום.')
    } finally {
      setAdding(false)
    }
  }

  const markPaid = async (paymentId: string) => {
    const updated = await vendorsApi.updatePayment(weddingId, vendorId, paymentId, { status: 'PAID' })
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? updated : p)))
  }

  const markPending = async (paymentId: string) => {
    const updated = await vendorsApi.updatePayment(weddingId, vendorId, paymentId, { status: 'PENDING' })
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? updated : p)))
  }

  const handleDelete = async (paymentId: string) => {
    if (!window.confirm('להסיר את התשלום?')) return
    await vendorsApi.removePayment(weddingId, vendorId, paymentId)
    setPayments((prev) => prev.filter((p) => p.id !== paymentId))
  }

  const triggerReceiptUpload = (paymentId: string) => {
    setReceiptTargetId(paymentId)
    receiptInputRef.current?.click()
  }

  const handleReceiptFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !receiptTargetId) return
    const paymentId = receiptTargetId
    setReceiptTargetId(null)
    try {
      const updated = await vendorsApi.uploadReceipt(weddingId, vendorId, paymentId, file)
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? updated : p)))
    } catch {
      setError('לא הצלחנו להעלות את הקבלה.')
    }
  }

  if (loading) return <p className="dash-page-sub">טוען תשלומים...</p>

  return (
    <div className="dash-vendor-payments">
      <input
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        ref={receiptInputRef}
        style={{ display: 'none' }}
        onChange={handleReceiptFileChange}
      />
      {error && <p className="dash-guest-error">{error}</p>}

      {payments.length === 0 ? (
        <p className="dash-page-sub">אין תשלומים מתוזמנים. הוסיפו למטה.</p>
      ) : (
        <div className="dash-vendor-payments-table-wrap">
          <table className="dash-vendor-payments-table">
            <thead>
              <tr>
                <th>סוג</th>
                <th>סכום</th>
                <th>לתשלום עד</th>
                <th>סטטוס</th>
                <th>קבלה</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className={payment.isOverdue ? 'dash-vendor-payments-row--overdue' : ''}
                >
                  <td>{TYPE_LABELS[payment.paymentType]}</td>
                  <td>₪{payment.amount.toLocaleString()}</td>
                  <td>
                    {payment.dueDate ?? '—'}
                    {payment.isOverdue && ' (באיחור)'}
                  </td>
                  <td>
                    {payment.status === 'PAID' ? (
                      <button type="button" onClick={() => markPending(payment.id)}>
                        שולם ({payment.paidDate})
                      </button>
                    ) : (
                      <button type="button" onClick={() => markPaid(payment.id)}>
                        סמנו כשולם
                      </button>
                    )}
                  </td>
                  <td>
                    {payment.hasReceipt && (
                      <a
                        href={vendorsApi.receiptUrl(weddingId, vendorId, payment.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {payment.receiptFileName ?? 'הצגה'}
                      </a>
                    )}
                    <button type="button" onClick={() => triggerReceiptUpload(payment.id)}>
                      {payment.hasReceipt ? 'החלפה' : 'העלאה'}
                    </button>
                  </td>
                  <td>
                    <button type="button" onClick={() => handleDelete(payment.id)}>
                      הסירו
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dash-vendor-payments-add-row">
        <select value={newType} onChange={(e) => setNewType(e.target.value as PaymentType)}>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          placeholder="סכום"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
        />
        <div className="dash-vendor-payments-add-row__date">
          {alreadyPaid ? (
            <DatePicker value={newPaidDate} onChange={setNewPaidDate} placeholder="שולם בתאריך" />
          ) : (
            <DatePicker value={newDueDate} onChange={setNewDueDate} placeholder="לתשלום עד (לא חובה)" />
          )}
        </div>
        <label className="dash-vendor-payments-add-row__paid-toggle">
          <input
            type="checkbox"
            checked={alreadyPaid}
            onChange={(e) => setAlreadyPaid(e.target.checked)}
          />
          כבר שולם
        </label>
        <button
          type="button"
          className="dash-vendor-payments-add-row__submit"
          onClick={handleAdd}
          disabled={adding || !newAmount || (alreadyPaid && !newPaidDate)}
        >
          + הוסיפו תשלום
        </button>
      </div>
    </div>
  )
}
