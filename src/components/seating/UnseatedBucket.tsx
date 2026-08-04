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
      className={`dash-unseated${isOver ? ' dash-unseated--over' : ''}`}
    >
      <div className="dash-unseated__header">
        <strong>ללא הושבה</strong>
        <span className="dash-table__capacity dash-table__capacity--ok">{assignments.length}</span>
      </div>
      <div className="dash-unseated__guests">
        {assignments.length === 0 && (
          <div className="dash-unseated__empty">גררו לכאן אורח כדי להוציא אותו מהושבה</div>
        )}
        {assignments.map((a) => (
          <GuestChip key={a.guestId} assignment={a} moved={a.tableId !== a.originalTableId} />
        ))}
      </div>
    </div>
  )
}
