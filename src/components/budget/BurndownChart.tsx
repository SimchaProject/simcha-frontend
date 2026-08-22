import { useMemo, useState } from 'react'
import type { BudgetBurndown, BurndownEvent } from '../../types/budget'

// Plain inline SVG rather than a charting dependency: one chart, one shape,
// and the tokens/RTL handling are already ours. Drawn on a 0..W/0..H user
// space and scaled by the viewBox, so it stays sharp at any width.
const W = 860
const H = 300
const PAD = { top: 26, right: 20, bottom: 46, left: 64 }

const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

const TYPE_LABELS: Record<BurndownEvent['paymentType'], string> = {
  DEPOSIT: 'מקדמה',
  INSTALLMENT: 'תשלום',
  FINAL: 'תשלום סופי',
}

const MONTHS = [
  'ינו',
  'פבר',
  'מרץ',
  'אפר',
  'מאי',
  'יונ',
  'יול',
  'אוג',
  'ספט',
  'אוק',
  'נוב',
  'דצמ',
]

const dayOf = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000

function shekels(value: number): string {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}K`
  return String(Math.round(value))
}

function shortDate(date: string): string {
  const [, month, day] = date.split('-')
  return `${Number(day)} ב${MONTHS[Number(month) - 1]}`
}

interface BurndownChartProps {
  data: BudgetBurndown
}

export function BurndownChart({ data }: BurndownChartProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const geometry = useMemo(() => {
    const points = data.points
    if (points.length < 2) return null

    const days = points.map((p) => dayOf(p.date))
    const minDay = Math.min(...days)
    const maxDay = Math.max(...days)
    const span = maxDay - minDay || 1

    // The axis runs 0..total on purpose. A burn-down's whole claim is "this
    // much of the budget is still yours", and zooming to the spent sliver
    // would turn ₪3K out of ₪197K into a dramatic-looking cliff.
    const top = Math.max(data.totalAmount, ...points.map((p) => p.planned))
    const x = (date: string) => PAD.left + ((dayOf(date) - minDay) / span) * PLOT_W
    const y = (value: number) => PAD.top + PLOT_H - (value / top) * PLOT_H

    // Payments land on a date, they don't trickle in continuously - so the
    // line steps down at each date rather than sloping between them.
    const stepPoints = (pick: (p: (typeof points)[number]) => number | null) => {
      const coords: { x: number; y: number }[] = []
      for (const point of points) {
        const value = pick(point)
        if (value === null) break
        const px = x(point.date)
        const py = y(value)
        if (coords.length) coords.push({ x: px, y: coords[coords.length - 1].y })
        coords.push({ x: px, y: py })
      }
      return coords
    }

    const toPath = (coords: { x: number; y: number }[]) =>
      coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')

    // Closing the line down to the baseline turns it into a filled area,
    // which reads as "this is the budget" far faster than a bare stroke.
    const toArea = (coords: { x: number; y: number }[]) => {
      if (!coords.length) return ''
      const base = PAD.top + PLOT_H
      const first = coords[0]
      const last = coords[coords.length - 1]
      return `${toPath(coords)} L ${last.x} ${base} L ${first.x} ${base} Z`
    }

    const plannedCoords = stepPoints((p) => p.planned)
    const actualCoords = stepPoints((p) => p.actual)

    // Month ticks at even spacing across the axis rather than one per month:
    // a nine-month engagement would otherwise crowd the axis, and a
    // three-week one would leave it almost empty.
    const tickCount = Math.min(6, Math.max(2, Math.round(PLOT_W / 130)))
    const monthTicks = Array.from({ length: tickCount }, (_, i) => {
      const day = minDay + (span * i) / (tickCount - 1)
      const date = new Date(day * 86_400_000).toISOString().slice(0, 10)
      return { x: x(date), label: MONTHS[Number(date.split('-')[1]) - 1] }
    })

    const valueTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      value: top * t,
      y: y(top * t),
    }))

    const eventDots = data.events
      .filter((event) => dayOf(event.date) >= minDay && dayOf(event.date) <= maxDay)
      .map((event) => {
        // Sit each marker on whichever curve it belongs to: a paid one on the
        // actual line it moved, a scheduled one on the plan.
        const point = data.points.find((p) => p.date === event.date)
        const value =
          event.status === 'PAID' ? (point?.actual ?? point?.planned ?? 0) : (point?.planned ?? 0)
        return { event, cx: x(event.date), cy: y(value) }
      })

    return {
      planned: toPath(plannedCoords),
      plannedArea: toArea(plannedCoords),
      actual: toPath(actualCoords),
      actualArea: toArea(actualCoords),
      todayX: x(data.today),
      weddingX: x(data.weddingDate),
      valueTicks,
      monthTicks,
      eventDots,
      baseY: PAD.top + PLOT_H,
      lastActual: [...points].reverse().find((p) => p.actual !== null) ?? null,
    }
  }, [data])

  if (!geometry) {
    return <p className="dash-page-sub">עוד אין מספיק תשלומים מתוזמנים כדי לצייר גרף.</p>
  }

  const {
    planned,
    plannedArea,
    actual,
    actualArea,
    todayX,
    weddingX,
    valueTicks,
    monthTicks,
    eventDots,
    baseY,
    lastActual,
  } = geometry

  const plannedNow = lastActual
    ? (data.points.find((p) => p.date === lastActual.date)?.planned ?? 0)
    : 0
  const behind = lastActual?.actual != null ? lastActual.actual - plannedNow : 0
  const dueBeforeWedding = data.events
    .filter((e) => e.status === 'PENDING')
    .reduce((sum, e) => sum + e.amount, 0)

  const hoveredDot = eventDots.find((d) => d.event.id === hovered) ?? null

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
        <span className={`dash-burndown__flag${behind > 0 ? ' is-behind' : ' is-ontrack'}`}>
          {behind > 0
            ? `פיגור של ₪${Math.round(behind).toLocaleString()} מול לוח התשלומים`
            : 'עומדים בלוח התשלומים'}
        </span>
        {dueBeforeWedding > 0 && (
          <span className="dash-burndown__due">
            ₪{dueBeforeWedding.toLocaleString()} עוד לתשלום
          </span>
        )}
      </div>

      <div className="dash-burndown__plot">
        <svg
          className="dash-burndown__svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="גרף שריפת תקציב: יתרת התקציב לאורך הזמן, מתוכנן מול בפועל"
        >
          <defs>
            <linearGradient id="burndown-planned" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--simcha-gold)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--simcha-gold)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="burndown-actual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--simcha-red)" stopOpacity="0.20" />
              <stop offset="100%" stopColor="var(--simcha-red)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {valueTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={tick.y}
                y2={tick.y}
                className="dash-burndown__grid"
              />
              <text
                x={PAD.left - 10}
                y={tick.y + 4}
                className="dash-burndown__tick"
                textAnchor="end"
              >
                ₪{shekels(tick.value)}
              </text>
            </g>
          ))}

          {monthTicks.map((tick, i) => (
            <text
              key={i}
              x={tick.x}
              y={H - 22}
              className="dash-burndown__tick"
              textAnchor="middle"
            >
              {tick.label}
            </text>
          ))}

          <path d={plannedArea} fill="url(#burndown-planned)" />
          <path d={actualArea} fill="url(#burndown-actual)" />

          <line
            x1={weddingX}
            x2={weddingX}
            y1={PAD.top - 6}
            y2={baseY}
            className="dash-burndown__marker dash-burndown__marker--wedding"
          />
          <text
            x={weddingX}
            y={PAD.top - 12}
            className="dash-burndown__marker-label"
            textAnchor="middle"
          >
            החתונה
          </text>

          <line
            x1={todayX}
            x2={todayX}
            y1={PAD.top - 6}
            y2={baseY}
            className="dash-burndown__marker dash-burndown__marker--today"
          />
          <text x={todayX} y={PAD.top - 12} className="dash-burndown__tick" textAnchor="middle">
            היום
          </text>

          <path d={planned} className="dash-burndown__line dash-burndown__line--planned" />
          <path d={actual} className="dash-burndown__line dash-burndown__line--actual" />

          {/* Each dot is one payment. This is what makes the chart worth
              looking at rather than just reading the totals: you can see when
              the money leaves, and hovering says who it goes to. */}
          {eventDots.map(({ event, cx, cy }) => (
            <circle
              key={event.id}
              cx={cx}
              cy={cy}
              r={hovered === event.id ? 7 : 4.5}
              className={`dash-burndown__dot dash-burndown__dot--${
                event.isOverdue ? 'overdue' : event.status === 'PAID' ? 'paid' : 'pending'
              }`}
              onMouseEnter={() => setHovered(event.id)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {hoveredDot && (
          <div
            className="dash-burndown__tooltip"
            style={{
              // Percentages of the plot, so it tracks the dot as the SVG
              // scales to the card width. Physical `left`, not
              // inset-inline-start: the chart is drawn LTR inside an RTL
              // page, and the logical property would put the tooltip at the
              // mirrored position.
              left: `${(hoveredDot.cx / W) * 100}%`,
              top: `${(hoveredDot.cy / H) * 100}%`,
            }}
          >
            <strong>{hoveredDot.event.vendorName}</strong>
            <span>
              {TYPE_LABELS[hoveredDot.event.paymentType]} · ₪
              {hoveredDot.event.amount.toLocaleString()}
            </span>
            <span className="dash-burndown__tooltip-date">
              {shortDate(hoveredDot.event.date)}
              {hoveredDot.event.isOverdue
                ? ' · באיחור'
                : hoveredDot.event.status === 'PAID'
                  ? ' · שולם'
                  : ' · מתוכנן'}
            </span>
          </div>
        )}
      </div>

      {data.undatedPaid > 0 && (
        <p className="dash-burndown__note">
          הגרף מתחיל מ-₪{(data.totalAmount - data.undatedPaid).toLocaleString()}: ₪
          {data.undatedPaid.toLocaleString()} סומנו כשולמו ברמת הספק, בלי תשלום מתוארך שאפשר למקם על
          ציר הזמן.
        </p>
      )}
    </div>
  )
}
