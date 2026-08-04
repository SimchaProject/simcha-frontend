import { useEffect, useState } from 'react'
import { seatingApi } from '../../api/seating'
import type { SeatingTable } from '../../types/seating'

interface Props {
  weddingId: string
  tables: SeatingTable[]
  onClose: () => void
  onTablesChange: (tables: SeatingTable[]) => void
}

interface Draft {
  label: string
  capacity: string
}

const emptyDraft: Draft = { label: '', capacity: '10' }

function nextPosition(index: number) {
  const col = index % 4
  const row = Math.floor(index / 4)
  return { x: 60 + col * 420, y: 60 + row * 420 }
}

export function TableSetupModal({ weddingId, tables, onClose, onTablesChange }: Props) {
  const [newTable, setNewTable] = useState<Draft>(emptyDraft)
  const [adding, setAdding] = useState(false)
  const [bulkCount, setBulkCount] = useState('8')
  const [bulkCapacity, setBulkCapacity] = useState('10')
  const [bulkAdding, setBulkAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const handleAdd = async () => {
    const label = newTable.label.trim()
    const capacity = Number(newTable.capacity)
    if (!label || !capacity || capacity < 1) return
    setAdding(true)
    setError(null)
    try {
      const { x, y } = nextPosition(tables.length)
      const created = await seatingApi.createTable(weddingId, { label, capacity, x, y })
      onTablesChange([...tables, created])
      setNewTable(emptyDraft)
    } catch {
      setError('לא ניתן היה להוסיף את השולחן.')
    } finally {
      setAdding(false)
    }
  }

  const handleBulkAdd = async () => {
    const count = Math.min(30, Math.max(1, Number(bulkCount) || 0))
    const capacity = Number(bulkCapacity)
    if (!count || !capacity || capacity < 1) return
    setBulkAdding(true)
    setError(null)
    try {
      const created: SeatingTable[] = []
      for (let i = 0; i < count; i++) {
        const { x, y } = nextPosition(tables.length + created.length)
        const table = await seatingApi.createTable(weddingId, {
          label: `שולחן ${tables.length + created.length + 1}`,
          capacity,
          x,
          y,
        })
        created.push(table)
      }
      onTablesChange([...tables, ...created])
    } catch {
      setError('לא ניתן היה להוסיף את השולחנות.')
    } finally {
      setBulkAdding(false)
    }
  }

  const startEdit = (table: SeatingTable) => {
    setEditingId(table.id)
    setEditDraft({ label: table.label, capacity: String(table.capacity) })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(emptyDraft)
  }

  const saveEdit = async (tableId: string) => {
    const label = editDraft.label.trim()
    const capacity = Number(editDraft.capacity)
    if (!label || !capacity || capacity < 1) return
    try {
      const updated = await seatingApi.updateTable(weddingId, tableId, { label, capacity })
      onTablesChange(tables.map((t) => (t.id === tableId ? updated : t)))
      cancelEdit()
    } catch {
      setError('לא ניתן היה לשמור את השינוי.')
    }
  }

  const handleDelete = async (tableId: string) => {
    if (!window.confirm('להסיר את השולחן? אורחים שהוצבו בו יחזרו לרשימת הממתינים.')) return
    try {
      await seatingApi.deleteTable(weddingId, tableId)
      onTablesChange(tables.filter((t) => t.id !== tableId))
    } catch {
      setError('לא ניתן היה להסיר את השולחן.')
    }
  }

  return (
    <div className="dash-table-modal-backdrop" onClick={onClose}>
      <div className="dash-table-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="dash-table-modal-close" onClick={onClose} aria-label="סגירה">
          ×
        </button>
        <p className="dash-page-title">ניהול שולחנות</p>
        <p className="dash-page-sub">
          הוסיפו, ערכו או הסירו שולחנות. את המיקום שלהם על הלוח אפשר לגרור בחופשיות.
        </p>

        <div className="dash-table-modal-add-row">
          <input
            type="text"
            placeholder="שם השולחן"
            value={newTable.label}
            onChange={(e) => setNewTable((prev) => ({ ...prev, label: e.target.value }))}
          />
          <input
            type="number"
            min="1"
            placeholder="כמות מקומות"
            value={newTable.capacity}
            onChange={(e) => setNewTable((prev) => ({ ...prev, capacity: e.target.value }))}
          />
          <button type="button" onClick={handleAdd} disabled={adding || !newTable.label.trim()}>
            + הוסיפו שולחן
          </button>
        </div>

        <div className="dash-table-modal-bulk-row">
          <span>הוסיפו</span>
          <input type="number" min="1" max="30" value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} />
          <span>שולחנות של</span>
          <input type="number" min="1" value={bulkCapacity} onChange={(e) => setBulkCapacity(e.target.value)} />
          <span>מקומות</span>
          <button type="button" onClick={handleBulkAdd} disabled={bulkAdding}>
            הוסיפו בבת אחת
          </button>
        </div>

        {error && <p className="dash-guest-error">{error}</p>}

        {tables.length === 0 ? (
          <p className="dash-page-sub">עדיין אין שולחנות. הוסיפו את הראשון למעלה.</p>
        ) : (
          <ul className="dash-table-modal-list">
            {tables.map((table) => (
              <li key={table.id}>
                {editingId === table.id ? (
                  <>
                    <input
                      type="text"
                      value={editDraft.label}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, label: e.target.value }))}
                    />
                    <input
                      type="number"
                      min="1"
                      value={editDraft.capacity}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, capacity: e.target.value }))}
                    />
                    <button type="button" onClick={() => saveEdit(table.id)}>
                      שמרו
                    </button>
                    <button type="button" onClick={cancelEdit}>
                      ביטול
                    </button>
                  </>
                ) : (
                  <>
                    <span className="dash-table-modal-list__label">{table.label}</span>
                    <span className="dash-table-modal-list__capacity">{table.capacity} מקומות</span>
                    <button type="button" onClick={() => startEdit(table)}>
                      ערכו
                    </button>
                    <button type="button" onClick={() => handleDelete(table.id)}>
                      הסירו
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
