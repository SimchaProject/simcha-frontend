import { useEffect, useState } from 'react'
import { useDashboard } from './dashboard-context'
import { guestsApi } from '../../api/guests'
import type { Guest, RsvpStatus } from '../../types/guest'

const STATUS_LABELS: Record<RsvpStatus, string> = {
  pending: 'ממתין',
  confirmed: 'מאושר',
  declined: 'לא מגיע',
}

interface GuestDraft {
  name: string
  phone: string
  partySize: string
}

const emptyDraft: GuestDraft = { name: '', phone: '', partySize: '1' }

export function GuestsPage() {
  const { wedding } = useDashboard()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newGuest, setNewGuest] = useState<GuestDraft>(emptyDraft)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<GuestDraft>(emptyDraft)

  useEffect(() => {
    let cancelled = false
    guestsApi
      .list(wedding.id)
      .then((result) => {
        if (cancelled) return
        setGuests(result)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError('לא הצלחנו לטעון את רשימת האורחים.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [wedding.id])

  const handleAdd = async () => {
    if (!newGuest.name.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const created = await guestsApi.create(wedding.id, {
        name: newGuest.name.trim(),
        phone: newGuest.phone.trim() || undefined,
        partySize: Number(newGuest.partySize) || 1,
      })
      setGuests((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'he')))
      setNewGuest(emptyDraft)
    } catch {
      setAddError('נא לוודא שהשם והטלפון תקינים.')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (guest: Guest) => {
    setEditingId(guest.id)
    setEditDraft({
      name: guest.name,
      phone: guest.phone ?? '',
      partySize: String(guest.partySize),
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(emptyDraft)
  }

  const saveEdit = async (guestId: string) => {
    try {
      const updated = await guestsApi.update(wedding.id, guestId, {
        name: editDraft.name.trim(),
        phone: editDraft.phone.trim() || undefined,
        partySize: Number(editDraft.partySize) || 1,
      })
      setGuests((prev) => prev.map((g) => (g.id === guestId ? updated : g)))
      cancelEdit()
    } catch {
      setError('לא הצלחנו לשמור את השינוי.')
    }
  }

  const handleStatusChange = async (guestId: string, rsvpStatus: RsvpStatus) => {
    const updated = await guestsApi.update(wedding.id, guestId, { rsvpStatus })
    setGuests((prev) => prev.map((g) => (g.id === guestId ? updated : g)))
  }

  const handleDelete = async (guestId: string) => {
    if (!window.confirm('להסיר את האורח מהרשימה?')) return
    await guestsApi.remove(wedding.id, guestId)
    setGuests((prev) => prev.filter((g) => g.id !== guestId))
  }

  return (
    <div className="dash-guests">
      <div className="dash-page-header">
        <p className="dash-page-title">אורחים</p>
        <p className="dash-page-sub">{guests.length} אורחים ברשימה</p>
      </div>

      <div className="dash-guest-add-row">
        <input
          type="text"
          placeholder="שם מלא"
          value={newGuest.name}
          onChange={(e) => setNewGuest((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="tel"
          placeholder="טלפון (לא חובה)"
          dir="ltr"
          value={newGuest.phone}
          onChange={(e) => setNewGuest((prev) => ({ ...prev, phone: e.target.value }))}
        />
        <input
          type="number"
          min="1"
          placeholder="כמות"
          value={newGuest.partySize}
          onChange={(e) => setNewGuest((prev) => ({ ...prev, partySize: e.target.value }))}
        />
        <button type="button" onClick={handleAdd} disabled={adding || !newGuest.name.trim()}>
          + הוסיפו אורח
        </button>
      </div>
      {addError && <p className="dash-guest-error">{addError}</p>}

      {loading && <p className="dash-page-sub">טוען...</p>}
      {error && <p className="dash-guest-error">{error}</p>}

      {!loading && guests.length === 0 && (
        <p className="dash-page-sub">עדיין אין אורחים ברשימה. הוסיפו את הראשון למעלה.</p>
      )}

      {!loading && guests.length > 0 && (
        <table className="dash-guest-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>טלפון</th>
              <th>כמות</th>
              <th>סטטוס</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.id}>
                {editingId === guest.id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        value={editDraft.name}
                        onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="tel"
                        dir="ltr"
                        value={editDraft.phone}
                        onChange={(e) => setEditDraft((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={editDraft.partySize}
                        onChange={(e) =>
                          setEditDraft((prev) => ({ ...prev, partySize: e.target.value }))
                        }
                      />
                    </td>
                    <td colSpan={2} className="dash-guest-table__edit-actions">
                      <button type="button" onClick={() => saveEdit(guest.id)}>
                        שמרו
                      </button>
                      <button type="button" onClick={cancelEdit}>
                        ביטול
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{guest.name}</td>
                    <td dir="ltr">{guest.phone ?? '—'}</td>
                    <td>{guest.partySize}</td>
                    <td>
                      <select
                        className={`dash-status-select dash-status-select--${guest.rsvpStatus}`}
                        value={guest.rsvpStatus}
                        onChange={(e) => handleStatusChange(guest.id, e.target.value as RsvpStatus)}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="dash-guest-table__actions">
                      <button type="button" onClick={() => startEdit(guest)}>
                        ערכו
                      </button>
                      <button type="button" onClick={() => handleDelete(guest.id)}>
                        הסירו
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
