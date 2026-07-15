import { useDraggable } from '@dnd-kit/core'
import type { SeatAssignment } from '../../types/seating'
import { avatarColor, initials } from './avatarColor'

interface ContentProps {
  assignment: SeatAssignment
  moved: boolean
}

export function GuestChipContent({ assignment, moved }: ContentProps) {
  return (
    <>
      <span className="guest-chip__avatar" style={{ background: avatarColor(assignment.guestName) }}>
        {initials(assignment.guestName)}
      </span>
      <span className="guest-chip__name">{assignment.guestName}</span>
      {assignment.locked && (
        <span className="guest-chip__lock" title="Manually placed">
          🔒
        </span>
      )}
      {moved && !assignment.locked && <span className="guest-chip__moved-dot" title="Moved by re-optimize" />}
    </>
  )
}

interface Props {
  assignment: SeatAssignment
  moved: boolean
}

export function GuestChip({ assignment, moved }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: assignment.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`guest-chip${assignment.locked ? ' guest-chip--locked' : ''}${moved ? ' guest-chip--moved' : ''}${isDragging ? ' guest-chip--dragging' : ''}`}
    >
      <GuestChipContent assignment={assignment} moved={moved} />
    </div>
  )
}
