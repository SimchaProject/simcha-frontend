import type { RsvpStatus } from '../../types/guests'

const LABELS: Record<RsvpStatus, string> = {
  PENDING: 'ממתין',
  ATTENDING: 'מגיע',
  DECLINED: 'לא מגיע',
}

export function RsvpStatusBadge({ status }: { status: RsvpStatus }) {
  return (
    <span className={`rsvp-badge rsvp-badge--${status.toLowerCase()}`}>{LABELS[status]}</span>
  )
}
