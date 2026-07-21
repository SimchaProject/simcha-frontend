import { useDroppable } from '@dnd-kit/core'
import type { SeatAssignment } from '../../types/seating'
import { GuestChip } from './GuestChip'

export const UNSEATED_DROPPABLE_ID = 'unseated'

interface Props {
  assignments: SeatAssignment[]
}

export function UnseatedBucket({ assignments }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: UNSEATED_DROPPABLE_ID })

  return (
    <div
      ref={setNodeRef}
      className={`seating-table seating-table--unseated${isOver ? ' seating-table--over' : ''}`}
    >
      <div className="seating-table__header">
        <strong>Unseated</strong>
        <span className="seating-table__capacity seating-table__capacity--ok">{assignments.length}</span>
      </div>
      <div className="seating-table__guests">
        {assignments.length === 0 && <div className="seating-table__empty">Drag a guest here to unseat them</div>}
        {assignments.map((a) => (
          <GuestChip key={a.id} assignment={a} moved={a.tableId !== a.originalTableId} />
        ))}
      </div>
    </div>
  )
}
