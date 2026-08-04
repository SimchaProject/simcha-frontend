import { useEffect, useRef, useState } from 'react'
import type { SeatAssignment, SeatingTable } from '../../types/seating'

interface Props {
  guests: SeatAssignment[]
  tables: SeatingTable[]
  currentOccupant?: SeatAssignment
  onAssign: (guestId: string) => void
  onRemove: () => void
  onClose: () => void
  style: React.CSSProperties
}

function tableLabel(tables: SeatingTable[], tableId: string | null) {
  return tables.find((t) => t.id === tableId)?.label
}

export function SeatPicker({ guests, tables, currentOccupant, onAssign, onRemove, onClose, style }: Props) {
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handlePointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const results = guests
    .filter((g) => g.guestId !== currentOccupant?.guestId)
    .filter((g) => g.guestName.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8)

  return (
    <div ref={rootRef} className="dash-seat-picker" style={style} onClick={(e) => e.stopPropagation()}>
      {currentOccupant && (
        <div className="dash-seat-picker__current">
          <span>{currentOccupant.guestName}</span>
          <button type="button" onClick={onRemove}>
            הסירו
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        placeholder="חפשו שם אורח..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="dash-seat-picker__results">
        {results.length === 0 && <li className="dash-seat-picker__empty">לא נמצאו אורחים</li>}
        {results.map((g) => {
          const currentLabel = tableLabel(tables, g.tableId)
          return (
            <li key={g.guestId}>
              <button type="button" onClick={() => onAssign(g.guestId)}>
                <span>{g.guestName}</span>
                {currentLabel && <span className="dash-seat-picker__where">כרגע: {currentLabel}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
