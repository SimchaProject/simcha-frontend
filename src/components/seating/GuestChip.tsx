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
      <span className="dash-guest-chip__avatar" style={{ background: avatarColor(assignment.guestName) }}>
        {initials(assignment.guestName)}
      </span>
      <span className="dash-guest-chip__name">{assignment.guestName}</span>
      {assignment.locked && (
        <span className="dash-guest-chip__lock" title="הוזז ידנית">
          🔒
        </span>
      )}
      {moved && !assignment.locked && (
        <span className="dash-guest-chip__moved-dot" title="הוזז על ידי אופטימיזציה מחדש" />
      )}
    </>
  )
}

interface Props {
  assignment: SeatAssignment
  moved: boolean
}

export function GuestChip({ assignment, moved }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: assignment.guestId,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`dash-guest-chip${assignment.locked ? ' dash-guest-chip--locked' : ''}${moved ? ' dash-guest-chip--moved' : ''}${isDragging ? ' dash-guest-chip--dragging' : ''}`}
    >
      <GuestChipContent assignment={assignment} moved={moved} />
    </div>
  )
}
