import { useMemo } from 'react'
import type { BudgetBurndown } from '../../types/budget'

// Plain inline SVG rather than a charting dependency: one chart, one shape,
// and the tokens/RTL handling are already ours. Drawn on a 0..W/0..H user
// space and scaled by the viewBox, so it stays sharp at any width.
const W = 720
const H = 240
const PAD = { top: 16, right: 16, bottom: 28, left: 56 }

const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

const dayOf = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000

function shekels(value: number): string {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}K`
  return String(Math.round(value))
}

function monthLabel(date: string): string {
  const [, month] = date.split('-')
  return ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'][
    Number(month) - 1
  ]
}

interface BurndownChartProps {
  data: BudgetBurndown
}

export function BurndownChart({ data }: BurndownChartProps) {
  const geometry = useMemo(() => {
    const points = data.points
    if (points.length < 2) return null

    const days = points.map((p) => dayOf(p.date))
    const minDay = Math.min(...days)
    const maxDay = Math.max(...days)
    const span = maxDay - minDay || 1

    const values = points.flatMap((p) => [p.planned, p.actual ?? p.planned])
    const top = Math.max(data.totalAmount, ...values)
    const bottom = Math.min(0, ...values)
    const range = top - bottom || 1

    const x = (date: string) => PAD.left + ((dayOf(date) - minDay) / span) * PLOT_W
    const y = (value: number) => PAD.top + PLOT_H - ((value - bottom) / range) * PLOT_H

    // Payments land on a date, they don't trickle in continuously - so the
    // line steps down at each date rather than sloping between them.
    const stepPath = (pick: (p: (typeof points)[number]) => number | null) => {
      const segments: string[] = []
      let previous: { x: number; y: number } | null = null
      for (const point of points) {
        const value = pick(point)
        if (value === null) break
        const px = x(point.date)
        const py = y(value)
        if (!previous) segments.push(`M ${px} ${py}`)
        else segments.push(`L ${px} ${previous.y}`, `L ${px} ${py}`)
        previous = { x: px, y: py }
      }
      return segments.join(' ')
    }

    const ticks = [0, 0.5, 1].map((t) => {
      const value = bottom + range * t
      return { value, y: y(value) }
    })

    // One label per month present in the data, placed at that month's first
    // point - enough to orient without crowding the axis. Months whose first
    // point lands right on top of the previous label are dropped rather than
    // drawn over it (the window opens a day before the first payment, so the
    // first two months are often a pixel apart).
    const seenMonths = new Set<string>()
    const monthTicks: { x: number; label: string }[] = []
    for (const point of points) {
      const key = point.date.slice(0, 7)
      if (seenMonths.has(key)) continue
      seenMonths.add(key)
      const px = x(point.date)
      const previous = monthTicks[monthTicks.length - 1]
      if (previous && px - previous.x < 34) {
        // The opening point sits one day before the first payment, so it
        // often collides with the month that actually covers that stretch of
        // the axis - that later month is the more useful label, so it wins.
        if (monthTicks.length === 1) monthTicks[0] = { x: px, label: monthLabel(point.date) }
        continue
      }
      monthTicks.push({ x: px, label: monthLabel(point.date) })
    }

    return {
      planned: stepPath((p) => p.planned),
      actual: stepPath((p) => p.actual),
      todayX: x(data.today),
      weddingX: x(data.weddingDate),
      ticks,
      monthTicks,
      lastActual: [...points].reverse().find((p) => p.actual !== null) ?? null,
    }
  }, [data])

  if (!geometry) {
    return <p className="dash-page-sub">עוד אין מספיק תשלומים מתוזמנים כדי לצייר גרף.</p>
  }

  const { planned, actual, todayX, weddingX, ticks, monthTicks, lastActual } = geometry
  const behind =
    lastActual && lastActual.actual !== null
      ? lastActual.actual - (data.points.find((p) => p.date === lastActual.date)?.planned ?? 0)
      : 0

  return (
    <div className="dash-burndown">
      <div className="dash-burndown__legend">
        <span>
          <span className="dash-burndown__swatch dash-burndown__swatch--planned" />
          לפי לוח התשלומים
        </span>
        <span>
          <span className="dash-burndown__swatch dash-burndown__swatch--actual" />
          שולם בפועל
        </span>
        {behind > 0 && (
          <span className="dash-burndown__flag">
            פיגור של ₪{Math.round(behind).toLocaleString()} מול לוח התשלומים
          </span>
        )}
      </div>

      <svg
        className="dash-burndown__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="גרף שריפת תקציב: יתרת התקציב לאורך הזמן, מתוכנן מול בפועל"
      >
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={tick.y}
              y2={tick.y}
              className="dash-burndown__grid"
            />
            <text x={PAD.left - 8} y={tick.y + 4} className="dash-burndown__tick" textAnchor="end">
              ₪{shekels(tick.value)}
            </text>
          </g>
        ))}

        {monthTicks.map((tick, i) => (
          <text
            key={`${tick.label}-${i}`}
            x={tick.x}
            y={H - 8}
            className="dash-burndown__tick"
            textAnchor="middle"
          >
            {tick.label}
          </text>
        ))}

        <line
          x1={weddingX}
          x2={weddingX}
          y1={PAD.top}
          y2={PAD.top + PLOT_H}
          className="dash-burndown__marker dash-burndown__marker--wedding"
        />
        <text
          x={weddingX}
          y={PAD.top - 4}
          className="dash-burndown__marker-label"
          textAnchor="middle"
        >
          החתונה
        </text>

        <line
          x1={todayX}
          x2={todayX}
          y1={PAD.top}
          y2={PAD.top + PLOT_H}
          className="dash-burndown__marker dash-burndown__marker--today"
        />
        <text x={todayX} y={PAD.top - 4} className="dash-burndown__tick" textAnchor="middle">
          היום
        </text>

        <path d={planned} className="dash-burndown__line dash-burndown__line--planned" />
        <path d={actual} className="dash-burndown__line dash-burndown__line--actual" />
      </svg>

      {data.undatedPaid > 0 && (
        <p className="dash-page-sub">
          הגרף מתחיל מ-₪{(data.totalAmount - data.undatedPaid).toLocaleString()}: ₪
          {data.undatedPaid.toLocaleString()} סומנו כשולמו ברמת הספק, בלי תשלום מתוארך שאפשר למקם על ציר
          הזמן.
        </p>
      )}
    </div>
  )
}
