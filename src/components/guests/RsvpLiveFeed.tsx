import type { RsvpSubmittedEvent } from '../../types/rsvp'
import { RsvpStatusBadge } from './RsvpStatusBadge'

interface RsvpLiveFeedProps {
  events: RsvpSubmittedEvent[]
}

export function RsvpLiveFeed({ events }: RsvpLiveFeedProps) {
  if (events.length === 0) return null

  return (
    <div className="rsvp-live-feed">
      <div className="rsvp-live-feed__header">
        <span>עדכוני אישורי הגעה אחרונים</span>
      </div>
      <ul className="rsvp-live-feed__list">
        {events.map((event, i) => (
          <li key={`${event.guestId}-${event.timestamp}-${i}`}>
            <span className="rsvp-live-feed__name">{event.name}</span>
            <RsvpStatusBadge status={event.rsvpStatus} />
          </li>
        ))}
      </ul>
    </div>
  )
}
