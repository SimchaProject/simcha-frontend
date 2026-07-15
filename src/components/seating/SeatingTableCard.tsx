import { useDroppable } from '@dnd-kit/core'
import type { SeatAssignment, SeatingTable } from '../../types/seating'
import { GuestChip } from './GuestChip'

interface Props {
  table: SeatingTable
  assignments: SeatAssignment[]
}

export function SeatingTableCard({ table, assignments }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: table.id })
  const occupancy = assignments.length
  const ratio = table.capacity > 0 ? occupancy / table.capacity : 0
  const capacityState = occupancy > table.capacity ? 'over' : ratio === 1 ? 'full' : 'ok'

  return (
    <div ref={setNodeRef} className={`seating-table${isOver ? ' seating-table--over' : ''}`}>
      <div className="seating-table__header">
        <strong>{table.label}</strong>
        <span className={`seating-table__capacity seating-table__capacity--${capacityState}`}>
          {occupancy}/{table.capacity}
        </span>
      </div>
      <div className="seating-table__guests">
        {assignments.length === 0 && <div className="seating-table__empty">Drop a guest here</div>}
        {assignments.map((a) => (
          <GuestChip key={a.id} assignment={a} moved={a.tableId !== a.originalTableId} />
        ))}
      </div>
    </div>
  )
}
