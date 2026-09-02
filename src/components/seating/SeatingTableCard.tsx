import { useState, type CSSProperties } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { SeatAssignment, SeatingTable } from '../../types/seating'
import { avatarColor, initials } from './avatarColor'
import { SeatPicker } from './SeatPicker'

export const TABLE_DRAG_PREFIX = 'table-pos:'
export const SEAT_DROP_PREFIX = 'seat:'

const SEAT_SIZE = 38
const SEAT_GAP = 10
const GAP_RADIUS = SEAT_GAP + SEAT_SIZE / 2

interface Props {
  table: SeatingTable
  assignments: SeatAssignment[]
  allGuests: SeatAssignment[]
  tables: SeatingTable[]
  zoom: number
  onAssign: (guestId: string, tableId: string, seatIndex?: number | null) => void
  onUnassign: (guestId: string) => void
}

function seatOffsetRound(index: number, total: number, radius: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

// Spaces seats evenly by arc-length around a rectangle's perimeter, starting
// at the top edge and going clockwise - naturally puts most seats along the
// long sides of a banquet table, few at the narrow ends, same as real life.
function seatOffsetPerimeter(index: number, total: number, width: number, height: number) {
  const perimeter = 2 * (width + height)
  const hw = width / 2 + GAP_RADIUS
  const hh = height / 2 + GAP_RADIUS
  let d = total > 0 ? (index / total) * perimeter : 0
  if (d <= width) return { x: d - width / 2, y: -hh }
  d -= width
  if (d <= height) return { x: hw, y: d - height / 2 }
  d -= height
  if (d <= width) return { x: width / 2 - d, y: hh }
  d -= width
  return { x: -hw, y: height / 2 - d }
}

function tableDims(table: SeatingTable) {
  if (table.shape === 'square') {
    const size = table.width ?? table.height ?? Math.min(320, Math.max(140, table.capacity * 22))
    return { width: size, height: size }
  }
  if (table.shape === 'rectangular') {
    const width = table.width ?? Math.min(760, Math.max(200, table.capacity * 40))
    const height = table.height ?? 120
    return { width, height }
  }
  const diameter = Math.min(260, Math.max(120, 90 + table.capacity * 12))
  return { width: diameter, height: diameter }
}

/** Places assignments into fixed seat slots: a chosen seatIndex sticks, everyone else fills whatever is left. */
function layoutSeats(assignments: SeatAssignment[], seatCount: number): (SeatAssignment | undefined)[] {
  const seats: (SeatAssignment | undefined)[] = new Array(seatCount).fill(undefined)
  const overflow: SeatAssignment[] = []
  for (const a of assignments) {
    if (a.seatIndex !== null && a.seatIndex >= 0 && a.seatIndex < seatCount && !seats[a.seatIndex]) {
      seats[a.seatIndex] = a
    } else {
      overflow.push(a)
    }
  }
  let cursor = 0
  for (const a of overflow) {
    while (cursor < seatCount && seats[cursor]) cursor++
    if (cursor < seatCount) seats[cursor] = a
  }
  return seats
}

interface SeatSlotProps {
  seatId: string
  assignment: SeatAssignment | undefined
  moved: boolean
  style: CSSProperties
  onClick: () => void
}

function SeatSlot({ seatId, assignment, moved, style, onClick }: SeatSlotProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: seatId })
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: assignment?.guestId ?? `empty:${seatId}`,
    disabled: !assignment,
  })

  const setRefs = (node: HTMLDivElement | null) => {
    setDropRef(node)
    setDragRef(node)
  }

  if (!assignment) {
    return (
      <div
        ref={setRefs}
        className={`dash-seat dash-seat--empty${isOver ? ' dash-seat--over' : ''}`}
        style={style}
        onClick={onClick}
      />
    )
  }

  return (
    <div
      ref={setRefs}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`dash-seat dash-seat--filled${assignment.locked ? ' dash-seat--locked' : ''}${moved ? ' dash-seat--moved' : ''}${isDragging ? ' dash-seat--dragging' : ''}${isOver ? ' dash-seat--over' : ''}`}
      style={{ ...style, background: avatarColor(assignment.guestName) }}
      title={assignment.guestName}
    >
      {initials(assignment.guestName)}
      {assignment.locked && <span className="dash-seat__lock">🔒</span>}
      {moved && !assignment.locked && <span className="dash-seat__moved-dot" />}
    </div>
  )
}

export function SeatingTableCard({ table, assignments, allGuests, tables, zoom, onAssign, onUnassign }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({ id: `${TABLE_DRAG_PREFIX}${table.id}` })
  const [openSeatIndex, setOpenSeatIndex] = useState<number | null>(null)

  const occupancy = assignments.length
  const ratio = table.capacity > 0 ? occupancy / table.capacity : 0
  const capacityState = occupancy > table.capacity ? 'over' : ratio === 1 ? 'full' : 'ok'
  const isRect = table.shape !== 'round'

  const { width: shapeWidth, height: shapeHeight } = tableDims(table)
  const seatCount = Math.max(table.capacity, occupancy)
  const seats = layoutSeats(assignments, seatCount)

  const boxWidth = shapeWidth + 2 * GAP_RADIUS + SEAT_SIZE
  const boxHeight = shapeHeight + 2 * GAP_RADIUS + SEAT_SIZE
  const centerX = boxWidth / 2
  const centerY = boxHeight / 2
  const shapeLeft = centerX - shapeWidth / 2
  const shapeTop = centerY - shapeHeight / 2
  const radius = shapeWidth / 2 + GAP_RADIUS

  const openSeatAssignment = openSeatIndex !== null ? seats[openSeatIndex] : undefined

  const seatOffset = (index: number) =>
    isRect ? seatOffsetPerimeter(index, seatCount, shapeWidth, shapeHeight) : seatOffsetRound(index, seatCount, radius)

  return (
    <div
      className={`dash-table-wrap${isDragging ? ' dash-table-wrap--dragging' : ''}`}
      style={{
        position: 'absolute',
        left: table.x,
        top: table.y,
        transform: transform ? `translate3d(${transform.x / zoom}px, ${transform.y / zoom}px, 0)` : undefined,
        zIndex: isDragging || openSeatIndex !== null ? 30 : 1,
      }}
    >
      <div ref={setDragRef} className="dash-table-hit" style={{ width: boxWidth, height: boxHeight }}>
        <div
          className={`dash-table${isRect ? ' dash-table--rect' : ''}`}
          style={{
            width: shapeWidth,
            height: shapeHeight,
            left: shapeLeft,
            top: shapeTop,
          }}
        >
          <button
            type="button"
            className="dash-table__handle"
            title="גררו כדי להזיז את השולחן"
            {...attributes}
            {...listeners}
          >
            ⠿
          </button>
          <strong className="dash-table__label">{table.label}</strong>
          <span className={`dash-table__capacity dash-table__capacity--${capacityState}`}>
            {occupancy}/{table.capacity}
          </span>
        </div>

        {seats.map((assignment, i) => {
          const { x, y } = seatOffset(i)
          const style: CSSProperties = {
            left: centerX + x - SEAT_SIZE / 2,
            top: centerY + y - SEAT_SIZE / 2,
          }
          return (
            <SeatSlot
              key={assignment ? assignment.guestId : `empty-${i}`}
              seatId={`${SEAT_DROP_PREFIX}${table.id}:${i}`}
              assignment={assignment}
              moved={!!assignment && assignment.tableId !== assignment.originalTableId}
              style={style}
              onClick={() => setOpenSeatIndex(i)}
            />
          )
        })}

        {openSeatIndex !== null &&
          (() => {
            const { x, y } = seatOffset(openSeatIndex)
            return (
              <SeatPicker
                guests={allGuests}
                tables={tables}
                currentOccupant={openSeatAssignment}
                onAssign={(guestId) => {
                  onAssign(guestId, table.id, openSeatIndex)
                  setOpenSeatIndex(null)
                }}
                onRemove={() => {
                  if (openSeatAssignment) onUnassign(openSeatAssignment.guestId)
                  setOpenSeatIndex(null)
                }}
                onClose={() => setOpenSeatIndex(null)}
                style={{
                  left: centerX + x - SEAT_SIZE / 2,
                  top: centerY + y + SEAT_SIZE / 2 + 6,
                }}
              />
            )
          })()}
      </div>
    </div>
  )
}
