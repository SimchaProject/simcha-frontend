import { useDraggable } from '@dnd-kit/core'
import type { SeatAssignment } from '../../types/seating'

interface Props {
  assignment: SeatAssignment
  moved: boolean
}

export function GuestChip({ assignment, moved }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: assignment.id,
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`guest-chip${assignment.locked ? ' guest-chip--locked' : ''}${moved ? ' guest-chip--moved' : ''}${isDragging ? ' guest-chip--dragging' : ''}`}
    >
      {assignment.locked && <span className="guest-chip__lock" title="Manually placed">🔒</span>}
      {assignment.guestName}
    </div>
  )
}
