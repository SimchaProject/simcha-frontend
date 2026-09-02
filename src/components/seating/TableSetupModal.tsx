import { useEffect, useState } from 'react'
import { seatingApi } from '../../api/seating'
import type { SeatingTable, TableShape } from '../../types/seating'

interface Props {
  weddingId: string
  tables: SeatingTable[]
  onClose: () => void
  onTablesChange: (tables: SeatingTable[]) => void
}

interface Draft {
  label: string
  capacity: string
  shape: TableShape
  size: string
  width: string
  height: string
}

const emptyDraft: Draft = { label: '', capacity: '10', shape: 'round', size: '', width: '', height: '' }

const SHAPE_LABELS: Record<TableShape, string> = {
  round: 'עגול',
  square: 'מרובע',
  rectangular: 'מלבני (שולחן ארוך)',
}

function shapeFields(draft: Draft) {
  if (draft.shape === 'square') {
    const size = Number(draft.size) || undefined
    return { shape: draft.shape, width: size, height: size }
  }
  if (draft.shape === 'rectangular') {
    return {
      shape: draft.shape,
      width: Number(draft.width) || undefined,
      height: Number(draft.height) || undefined,
    }
  }
  return { shape: draft.shape, width: undefined, height: undefined }
}

function draftFromTable(table: SeatingTable): Draft {
  return {
    label: table.label,
    capacity: String(table.capacity),
    shape: table.shape,
    size: table.shape === 'square' && table.width ? String(table.width) : '',
    width: table.shape === 'rectangular' && table.width ? String(table.width) : '',
    height: table.shape === 'rectangular' && table.height ? String(table.height) : '',
  }
}

function nextPosition(index: number) {
  const col = index % 4
  const row = Math.floor(index / 4)
  return { x: 60 + col * 420, y: 60 + row * 420 }
}

interface ShapeInputsProps {
  draft: Draft
  onChange: (draft: Draft) => void
}

function ShapeInputs({ draft, onChange }: ShapeInputsProps) {
  return (
    <>
      <select value={draft.shape} onChange={(e) => onChange({ ...draft, shape: e.target.value as TableShape })}>
        {Object.entries(SHAPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {draft.shape === 'square' && (
        <input
          type="number"
          min="1"
          placeholder="גודל (אופציונלי)"
          value={draft.size}
          onChange={(e) => onChange({ ...draft, size: e.target.value })}
        />
      )}
      {draft.shape === 'rectangular' && (
        <>
          <input
            type="number"
            min="1"
            placeholder="אורך (אופציונלי)"
            value={draft.width}
            onChange={(e) => onChange({ ...draft, width: e.target.value })}
          />
          <input
            type="number"
            min="1"
            placeholder="רוחב (אופציונלי)"
            value={draft.height}
            onChange={(e) => onChange({ ...draft, height: e.target.value })}
          />
        </>
      )}
    </>
  )
}

export function TableSetupModal({ weddingId, tables, onClose, onTablesChange }: Props) {
  const [newTable, setNewTable] = useState<Draft>(emptyDraft)
  const [adding, setAdding] = useState(false)
  const [bulkCount, setBulkCount] = useState('8')
  const [bulkCapacity, setBulkCapacity] = useState('10')
  const [bulkShape, setBulkShape] = useState<TableShape>('round')
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
      const created = await seatingApi.createTable(weddingId, {
        label,
        capacity,
        x,
        y,
        ...shapeFields(newTable),
      })
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
          shape: bulkShape,
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
    setEditDraft(draftFromTable(table))
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
      const updated = await seatingApi.updateTable(weddingId, tableId, {
        label,
        capacity,
        ...shapeFields(editDraft),
      })
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
          הוסיפו, ערכו או הסירו שולחנות. בחרו צורה (עגול / מרובע / מלבני לשולחנות ארוכים) וגודל, ואת המיקום שלהם על
          הלוח אפשר לגרור בחופשיות.
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
          <ShapeInputs draft={newTable} onChange={setNewTable} />
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
          <select value={bulkShape} onChange={(e) => setBulkShape(e.target.value as TableShape)}>
            {Object.entries(SHAPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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
                    <ShapeInputs draft={editDraft} onChange={setEditDraft} />
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
                    <span className="dash-table-modal-list__shape">{SHAPE_LABELS[table.shape]}</span>
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
