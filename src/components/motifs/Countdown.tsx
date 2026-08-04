import { useEffect, useState } from 'react'

interface CountdownProps {
  targetDate: string // YYYY-MM-DD
}

interface Remaining {
  days: number
  hours: number
  minutes: number
}

function computeRemaining(targetDate: string): Remaining | null {
  const target = new Date(`${targetDate}T00:00:00`).getTime()
  const diffMs = target - Date.now()
  if (diffMs <= 0) return null

  const minutesTotal = Math.floor(diffMs / 60_000)
  return {
    days: Math.floor(minutesTotal / (60 * 24)),
    hours: Math.floor((minutesTotal % (60 * 24)) / 60),
    minutes: minutesTotal % 60,
  }
}

// A wedding countdown doesn't need per-second updates - once a minute is
// plenty and far cheaper on re-renders.
export function Countdown({ targetDate }: CountdownProps) {
  const [remaining, setRemaining] = useState<Remaining | null>(() =>
    computeRemaining(targetDate),
  )

  useEffect(() => {
    const interval = setInterval(() => setRemaining(computeRemaining(targetDate)), 60_000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (!remaining) return null

  return (
    <div className="invite-countdown">
      <div className="invite-countdown__unit">
        <span className="invite-countdown__num">{remaining.days}</span>
        <span className="invite-countdown__label">ימים</span>
      </div>
      <div className="invite-countdown__unit">
        <span className="invite-countdown__num">{remaining.hours}</span>
        <span className="invite-countdown__label">שעות</span>
      </div>
      <div className="invite-countdown__unit">
        <span className="invite-countdown__num">{remaining.minutes}</span>
        <span className="invite-countdown__label">דקות</span>
      </div>
    </div>
  )
}
