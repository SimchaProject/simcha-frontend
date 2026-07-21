import type { SeatingTable, SeatAssignment } from '../../types/seating'

interface Props {
  tables: SeatingTable[]
  assignments: SeatAssignment[]
}

function tableLabel(tables: SeatingTable[], tableId: string | null) {
  if (!tableId) return 'Unseated'
  return tables.find((t) => t.id === tableId)?.label ?? 'Unknown table'
}

export function SeatingDiff({ tables, assignments }: Props) {
  const moved = assignments.filter((a) => a.tableId !== a.originalTableId)

  return (
    <div className="seating-diff-panel">
      {moved.length === 0 ? (
        <p className="seating-diff__empty">No manual overrides yet — this matches the optimizer's output.</p>
      ) : (
        <ul className="seating-diff">
          {moved.map((a, i) => (
            <li key={a.id} style={{ animationDelay: `${i * 40}ms` }}>
              <strong>{a.guestName}</strong>
              <span className="seating-diff__from">{tableLabel(tables, a.originalTableId)}</span>
              <span className="seating-diff__arrow">→</span>
              <span className="seating-diff__to">{tableLabel(tables, a.tableId)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
