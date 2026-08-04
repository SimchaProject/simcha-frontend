import { useState, type CSSProperties } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { SeatAssignment, SeatingTable } from '../../types/seating'
import { avatarColor, initials } from './avatarColor'
import { SeatPicker } from './SeatPicker'

export const TABLE_DRAG_PREFIX = 'table-pos:'

const SEAT_SIZE = 38
const SEAT_GAP = 10

interface Props {
  table: SeatingTable
  assignments: SeatAssignment[]
  allGuests: SeatAssignment[]
  tables: SeatingTable[]
  zoom: number
  onAssign: (guestId: string, tableId: string) => void
  onUnassign: (guestId: string) => void
}

function seatOffset(index: number, total: number, radius: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

interface GuestSeatProps {
  assignment: SeatAssignment
  moved: boolean
  style: CSSProperties
  onClick: () => void
}

function GuestSeat({ assignment, moved, style, onClick }: GuestSeatProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: assignment.guestId })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`dash-seat dash-seat--filled${assignment.locked ? ' dash-seat--locked' : ''}${moved ? ' dash-seat--moved' : ''}${isDragging ? ' dash-seat--dragging' : ''}`}
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
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: table.id })
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({ id: `${TABLE_DRAG_PREFIX}${table.id}` })
  const [openSeatIndex, setOpenSeatIndex] = useState<number | null>(null)

  const setHitRef = (node: HTMLDivElement | null) => {
    setDropRef(node)
    setDragRef(node)
  }

  const occupancy = assignments.length
  const ratio = table.capacity > 0 ? occupancy / table.capacity : 0
  const capacityState = occupancy > table.capacity ? 'over' : ratio === 1 ? 'full' : 'ok'

  const diameter = Math.min(260, Math.max(120, 90 + table.capacity * 12))
  const seatCount = Math.max(table.capacity, occupancy)
  const radius = diameter / 2 + SEAT_GAP + SEAT_SIZE / 2
  const boxSize = Math.round(2 * radius + SEAT_SIZE)
  const center = boxSize / 2
  const circleOffset = center - diameter / 2

  const openSeatAssignment = openSeatIndex !== null ? assignments[openSeatIndex] : undefined

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
      <div ref={setHitRef} className="dash-table-hit" style={{ width: boxSize, height: boxSize }}>
        <div
          className={`dash-table${isOver ? ' dash-table--over' : ''}`}
          style={{
            width: diameter,
            height: diameter,
            left: circleOffset,
            top: circleOffset,
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

        {Array.from({ length: seatCount }).map((_, i) => {
          const { x, y } = seatOffset(i, seatCount, radius)
          const style: CSSProperties = {
            left: center + x - SEAT_SIZE / 2,
            top: center + y - SEAT_SIZE / 2,
          }
          const assignment = assignments[i]
          if (!assignment) {
            return (
              <div
                key={`empty-${i}`}
                className="dash-seat dash-seat--empty"
                style={style}
                onClick={() => setOpenSeatIndex(i)}
              />
            )
          }
          return (
            <GuestSeat
              key={assignment.guestId}
              assignment={assignment}
              moved={assignment.tableId !== assignment.originalTableId}
              style={style}
              onClick={() => setOpenSeatIndex(i)}
            />
          )
        })}

        {openSeatIndex !== null &&
          (() => {
            const { x, y } = seatOffset(openSeatIndex, seatCount, radius)
            return (
              <SeatPicker
                guests={allGuests}
                tables={tables}
                currentOccupant={openSeatAssignment}
                onAssign={(guestId) => {
                  onAssign(guestId, table.id)
                  setOpenSeatIndex(null)
                }}
                onRemove={() => {
                  if (openSeatAssignment) onUnassign(openSeatAssignment.guestId)
                  setOpenSeatIndex(null)
                }}
                onClose={() => setOpenSeatIndex(null)}
                style={{
                  left: center + x - SEAT_SIZE / 2,
                  top: center + y + SEAT_SIZE / 2 + 6,
                }}
              />
            )
          })()}
      </div>
    </div>
  )
}
