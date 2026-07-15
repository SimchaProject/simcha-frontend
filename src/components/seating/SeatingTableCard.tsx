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

  return (
    <div ref={setNodeRef} className={`seating-table${isOver ? ' seating-table--over' : ''}`}>
      <div className="seating-table__header">
        <strong>{table.label}</strong>
        <span className={occupancy > table.capacity ? 'seating-table__capacity--over' : ''}>
          {occupancy}/{table.capacity}
        </span>
      </div>
      <div className="seating-table__guests">
        {assignments.map((a) => (
          <GuestChip key={a.id} assignment={a} moved={a.tableId !== a.originalTableId} />
        ))}
      </div>
    </div>
  )
}
