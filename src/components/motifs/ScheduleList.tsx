import type { ScheduleEntry } from '../../types/wedding'

interface ScheduleListProps {
  entries: ScheduleEntry[]
}

export function ScheduleList({ entries }: ScheduleListProps) {
  if (entries.length === 0) return null

  return (
    <div className="invite-schedule">
      <p className="invite-section-title">סדר היום</p>
      <ul className="invite-schedule__list">
        {entries.map((entry, i) => (
          <li key={i} className="invite-schedule__row">
            <span className="invite-schedule__time">{entry.time}</span>
            <span className="invite-schedule__label">{entry.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
