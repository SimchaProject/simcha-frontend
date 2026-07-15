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

  if (moved.length === 0) {
    return <p className="seating-diff__empty">No manual overrides yet — this matches the optimizer's output.</p>
  }

  return (
    <ul className="seating-diff">
      {moved.map((a) => (
        <li key={a.id}>
          <strong>{a.guestName}</strong>: {tableLabel(tables, a.originalTableId)} → {tableLabel(tables, a.tableId)}
        </li>
      ))}
    </ul>
  )
}
