import { useEffect, useRef, useState } from 'react'
import { HEBREW_MONTH_NAMES, parseISODate } from '../../lib/hebrewDate'
import './DatePicker.css'

const WEEKDAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

interface DatePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  hasError?: boolean
}

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplay(date: Date): string {
  return `${date.getDate()} ב${HEBREW_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function DatePicker({ id, value, onChange, min, max, placeholder, hasError }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseISODate(value)
  const minDate = min ? parseISODate(min) : null
  const maxDate = max ? parseISODate(max) : null
  const [viewDate, setViewDate] = useState(() => selected ?? new Date())
  const [prevValue, setPrevValue] = useState(value)
  const rootRef = useRef<HTMLDivElement>(null)

  if (value !== prevValue) {
    setPrevValue(value)
    const next = parseISODate(value)
    if (next) setViewDate(next)
  }

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  return (
    <div className="date-picker" ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`date-picker__trigger${hasError ? ' date-picker__trigger--error' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        {selected ? (
          formatDisplay(selected)
        ) : (
          <span className="date-picker__placeholder">{placeholder ?? 'בחרו תאריך'}</span>
        )}
      </button>

      {open && (
        <div className="date-picker__popover">
          <div className="date-picker__header">
            <button
              type="button"
              className="date-picker__nav"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              aria-label="חודש קודם"
            >
              ‹
            </button>
            <span className="date-picker__month-label">
              {HEBREW_MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              className="date-picker__nav"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              aria-label="חודש הבא"
            >
              ›
            </button>
          </div>

          <div className="date-picker__weekdays">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="date-picker__grid">
            {cells.map((date, i) =>
              date ? (
                <button
                  type="button"
                  key={i}
                  className={`date-picker__day${selected && isSameDay(date, selected) ? ' date-picker__day--selected' : ''}`}
                  disabled={Boolean((minDate && date < minDate) || (maxDate && date > maxDate))}
                  onClick={() => {
                    onChange(toISO(date))
                    setOpen(false)
                  }}
                >
                  {date.getDate()}
                </button>
              ) : (
                <span key={`empty-${i}`} />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}
