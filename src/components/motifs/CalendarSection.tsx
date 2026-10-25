import { apiUrl } from '../../api/http'
import type { ScheduleEntry } from '../../types/wedding'

interface CalendarSectionProps {
  slug: string
  coupleNameA: string
  coupleNameB: string
  date: string
  venue: string
  schedule: ScheduleEntry[]
  ceremonyTime: string | null
}

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/
const EVENT_HOURS = 5

// Same rule as the backend's wedding-calendar.ts, so both buttons add the
// same event: the first schedule entry, else the ceremony, else all day.
function startTime(schedule: ScheduleEntry[], ceremonyTime: string | null): string | null {
  const first = schedule.find((entry) => HH_MM.test(entry.time))
  if (first) return first.time
  return ceremonyTime && HH_MM.test(ceremonyTime) ? ceremonyTime : null
}

// Google takes Israel wall-clock times as-is when given ctz, so no time
// zone math here - just the wall clock, plus the event's length.
function googleDates(date: string, time: string | null): string {
  const [year, month, day] = date.split('-').map(Number)
  const stamp = (d: Date, withTime: boolean) =>
    d
      .toISOString()
      .slice(0, withTime ? 19 : 10)
      .replace(/[-:]/g, '')
  if (!time) {
    return `${stamp(new Date(Date.UTC(year, month - 1, day)), false)}/${stamp(new Date(Date.UTC(year, month - 1, day + 1)), false)}`
  }
  const [hour, minute] = time.split(':').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day, hour, minute))
  const end = new Date(start.getTime() + EVENT_HOURS * 60 * 60 * 1000)
  return `${stamp(start, true)}/${stamp(end, true)}`
}

// "Add to calendar" for guests: the .ics file (iPhone's own calendar,
// Outlook, Android) and a Google Calendar link.
export function CalendarSection({
  slug,
  coupleNameA,
  coupleNameB,
  date,
  venue,
  schedule,
  ceremonyTime,
}: CalendarSectionProps) {
  const pageUrl = `${window.location.origin}/w/${slug}`
  const google = new URL('https://calendar.google.com/calendar/render')
  google.searchParams.set('action', 'TEMPLATE')
  google.searchParams.set('text', `החתונה של ${coupleNameA} ו${coupleNameB}`)
  google.searchParams.set('dates', googleDates(date, startTime(schedule, ceremonyTime)))
  google.searchParams.set('ctz', 'Asia/Jerusalem')
  google.searchParams.set('location', venue)
  google.searchParams.set('details', `פרטים ואישור הגעה: ${pageUrl}`)

  return (
    <div className="invite-calendar">
      <p className="invite-section-title">שמרו את התאריך</p>
      <div className="invite-calendar__links">
        <a className="invite-map-link" href={apiUrl(`/weddings/${slug}/calendar.ics`)}>
          הוספה ליומן (אייפון / אאוטלוק)
        </a>
        <a className="invite-map-link" href={google.toString()} target="_blank" rel="noopener noreferrer">
          הוספה ל-Google Calendar
        </a>
      </div>
    </div>
  )
}
