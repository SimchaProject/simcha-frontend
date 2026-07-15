import { useDroppable } from '@dnd-kit/core'
import type { SeatAssignment } from '../../types/seating'
import { GuestChip } from './GuestChip'

export const UNSEATED_DROPPABLE_ID = 'unseated'

interface Props {
  assignments: SeatAssignment[]
}

export function UnseatedBucket({ assignments }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: UNSEATED_DROPPABLE_ID })

  if (assignments.length === 0) return null

  return (
    <div ref={setNodeRef} className={`seating-table seating-table--unseated${isOver ? ' seating-table--over' : ''}`}>
      <div className="seating-table__header">
        <strong>Unseated</strong>
        <span>{assignments.length}</span>
      </div>
      <div className="seating-table__guests">
        {assignments.map((a) => (
          <GuestChip key={a.id} assignment={a} moved={a.tableId !== a.originalTableId} />
        ))}
      </div>
    </div>
  )
}
