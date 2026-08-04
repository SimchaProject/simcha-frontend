import type { SeatingTable, SeatAssignment } from '../../types/seating'

interface Props {
  tables: SeatingTable[]
  assignments: SeatAssignment[]
}

function tableLabel(tables: SeatingTable[], tableId: string | null) {
  if (!tableId) return 'ללא הושבה'
  return tables.find((t) => t.id === tableId)?.label ?? 'שולחן לא ידוע'
}

export function SeatingDiff({ tables, assignments }: Props) {
  const moved = assignments.filter((a) => a.tableId !== a.originalTableId)

  return (
    <div className="dash-seating-diff-panel">
      {moved.length === 0 ? (
        <p className="dash-seating-diff__empty">אין שינויים ידניים עדיין — ההושבה תואמת את פלט האופטימיזציה.</p>
      ) : (
        <ul className="dash-seating-diff">
          {moved.map((a, i) => (
            <li key={a.guestId} style={{ animationDelay: `${i * 40}ms` }}>
              <strong>{a.guestName}</strong>
              <span className="dash-seating-diff__from">{tableLabel(tables, a.originalTableId)}</span>
              <span className="dash-seating-diff__arrow">←</span>
              <span className="dash-seating-diff__to">{tableLabel(tables, a.tableId)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
