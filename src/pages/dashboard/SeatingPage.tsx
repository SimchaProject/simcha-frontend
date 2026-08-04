import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useDashboard } from './dashboard-context'
import { seatingApi } from '../../api/seating'
import { guestsApi } from '../../api/guests'
import type { SeatAssignment, SeatingReport, SeatingSnapshot } from '../../types/seating'
import type { Guest } from '../../types/guest'
import { SeatingTableCard, TABLE_DRAG_PREFIX } from '../../components/seating/SeatingTableCard'
import { UnseatedBucket, UNSEATED_DROPPABLE_ID } from '../../components/seating/UnseatedBucket'
import { SeatingDiff } from '../../components/seating/SeatingDiff'
import { GuestChipContent } from '../../components/seating/GuestChip'
import { TableSetupModal } from '../../components/seating/TableSetupModal'
import { WaxSealButton } from '../../components/motifs/WaxSealButton'
import './seating.css'

type BusyAction = 'optimize' | 'reoptimize' | null

const ZOOM_MIN = 0.4
const ZOOM_MAX = 1.6
const ZOOM_STEP = 0.15

export function SeatingPage() {
  const { wedding } = useDashboard()
  const weddingId = wedding.id

  const [snapshot, setSnapshot] = useState<SeatingSnapshot | null>(null)
  const [guests, setGuests] = useState<Guest[] | null>(null)
  const [report, setReport] = useState<SeatingReport | null>(null)
  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    let cancelled = false
    Promise.all([seatingApi.getSnapshot(weddingId), guestsApi.list(weddingId)])
      .then(([snap, guestList]) => {
        if (cancelled) return
        setSnapshot(snap)
        setGuests(guestList)
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(String(e))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [weddingId])

  const mergedAssignments = useMemo<SeatAssignment[]>(() => {
    if (!snapshot || !guests) return []
    const byGuestId = new Map(snapshot.assignments.map((a) => [a.guestId, a]))
    return guests.map(
      (g) =>
        byGuestId.get(g.id) ?? {
          guestId: g.id,
          guestName: g.name,
          tableId: null,
          originalTableId: null,
          locked: false,
        },
    )
  }, [snapshot, guests])

  const runOptimize = async (reoptimize: boolean) => {
    setBusyAction(reoptimize ? 'reoptimize' : 'optimize')
    setError(null)
    try {
      const result = reoptimize
        ? await seatingApi.reoptimize(weddingId)
        : await seatingApi.optimize(weddingId)
      setSnapshot({ tables: result.tables, assignments: result.assignments })
      setReport(result.report)
    } catch (e) {
      setError(String(e))
    } finally {
      setBusyAction(null)
    }
  }

  const assignGuestToTable = async (guestId: string, tableId: string | null) => {
    if (!snapshot || !guests) return
    const guestName = guests.find((g) => g.id === guestId)?.name ?? ''
    const previous = snapshot
    setSnapshot({
      ...snapshot,
      assignments: snapshot.assignments.some((a) => a.guestId === guestId)
        ? snapshot.assignments.map((a) => (a.guestId === guestId ? { ...a, tableId, locked: true } : a))
        : [...snapshot.assignments, { guestId, guestName, tableId, originalTableId: null, locked: true }],
    })

    try {
      await seatingApi.assignGuest(weddingId, guestId, tableId)
    } catch (e) {
      setError(String(e))
      setSnapshot(previous)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over, delta } = event
    const activeIdStr = String(active.id)

    if (activeIdStr.startsWith(TABLE_DRAG_PREFIX)) {
      if (!snapshot) return
      const tableId = activeIdStr.slice(TABLE_DRAG_PREFIX.length)
      const table = snapshot.tables.find((t) => t.id === tableId)
      if (!table) return

      const newX = Math.max(0, Math.round(table.x + delta.x / zoom))
      const newY = Math.max(0, Math.round(table.y + delta.y / zoom))
      const previous = snapshot
      setSnapshot({
        ...snapshot,
        tables: snapshot.tables.map((t) => (t.id === tableId ? { ...t, x: newX, y: newY } : t)),
      })

      try {
        await seatingApi.updateTable(weddingId, tableId, { x: newX, y: newY })
      } catch (e) {
        setError(String(e))
        setSnapshot(previous)
      }
      return
    }

    if (!over) return
    const assignment = mergedAssignments.find((a) => a.guestId === activeIdStr)
    if (!assignment) return

    const newTableId = over.id === UNSEATED_DROPPABLE_ID ? null : String(over.id)
    if (newTableId === assignment.tableId) return

    await assignGuestToTable(assignment.guestId, newTableId)
  }

  const activeAssignment = mergedAssignments.find((a) => a.guestId === activeId)

  const canvasSize = useMemo(() => {
    if (!snapshot || snapshot.tables.length === 0) return { width: 1200, height: 700 }
    const maxX = Math.max(...snapshot.tables.map((t) => t.x)) + 400
    const maxY = Math.max(...snapshot.tables.map((t) => t.y)) + 400
    return { width: Math.max(1200, maxX), height: Math.max(700, maxY) }
  }, [snapshot])

  const adjustZoom = (delta: number) => {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100)))
  }

  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    adjustZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)
  }

  if (loading) {
    return (
      <div className="dash-seating">
        <p className="dash-page-sub">טוען...</p>
      </div>
    )
  }

  return (
    <div className="dash-seating">
      <div className="dash-page-header dash-seating__header">
        <div>
          <p className="dash-page-title">סידור הושבה</p>
          {guests && (
            <p className="dash-page-sub">
              {guests.length} אורחים · {snapshot?.tables.length ?? 0} שולחנות
            </p>
          )}
        </div>
        <WaxSealButton
          onClick={() => runOptimize(false)}
          loading={busyAction === 'optimize'}
          disabled={busyAction !== null || !snapshot || snapshot.tables.length === 0}
        >
          הפעילו
          <br />
          אופטימיזציה
        </WaxSealButton>
      </div>

      <div className="dash-seating__toolbar">
        <button type="button" className="dash-seating__btn" onClick={() => setShowTableModal(true)}>
          ניהול שולחנות
        </button>
        <button
          type="button"
          className="dash-seating__btn"
          onClick={() => runOptimize(true)}
          disabled={busyAction !== null || !snapshot}
        >
          {busyAction === 'reoptimize' && <span className="dash-seating__spinner" />}
          אופטימיזציה מחדש למקומות פנויים
        </button>
        <button
          type="button"
          className="dash-seating__btn dash-seating__btn--ghost"
          onClick={() => setShowDiff((v) => !v)}
          disabled={!snapshot}
        >
          {showDiff ? 'הסתירו' : 'הציגו'} שינויים ידניים
        </button>

        <div className="dash-seating__zoom">
          <button type="button" onClick={() => adjustZoom(-ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} title="הקטינו">
            −
          </button>
          <button type="button" className="dash-seating__zoom-value" onClick={() => setZoom(1)} title="איפוס תצוגה">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={() => adjustZoom(ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} title="הגדילו">
            +
          </button>
        </div>
      </div>

      {error && <p className="dash-guest-error">{error}</p>}
      {report && (
        <p className="dash-page-sub">
          ציון <strong>{report.initialScore}</strong> ← <strong>{report.finalScore}</strong> אחרי{' '}
          {report.iterations} איטרציות ({report.durationMs} מילישניות)
        </p>
      )}

      <div className={`dash-seating-diff-wrapper${showDiff ? ' is-open' : ''}`}>
        {snapshot && <SeatingDiff tables={snapshot.tables} assignments={mergedAssignments} />}
      </div>

      {snapshot && snapshot.tables.length === 0 ? (
        <div className="dash-seating__empty">
          <p>עדיין אין שולחנות בהושבה.</p>
          <button type="button" className="dash-seating__btn" onClick={() => setShowTableModal(true)}>
            הוסיפו שולחנות כדי להתחיל
          </button>
        </div>
      ) : snapshot ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <UnseatedBucket assignments={mergedAssignments.filter((a) => a.tableId === null)} />

          <div className="dash-seating__canvas" onWheel={handleCanvasWheel}>
            <div
              className="dash-seating__canvas-inner"
              style={{
                width: canvasSize.width * zoom,
                height: canvasSize.height * zoom,
              }}
            >
              <div
                className="dash-seating__canvas-content"
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  transform: `scale(${zoom})`,
                }}
              >
                {snapshot.tables.map((table) => (
                  <SeatingTableCard
                    key={table.id}
                    table={table}
                    assignments={mergedAssignments.filter((a) => a.tableId === table.id)}
                    allGuests={mergedAssignments}
                    tables={snapshot.tables}
                    zoom={zoom}
                    onAssign={assignGuestToTable}
                    onUnassign={(guestId) => assignGuestToTable(guestId, null)}
                  />
                ))}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeAssignment && (
              <div className="dash-guest-chip dash-guest-chip--overlay">
                <GuestChipContent
                  assignment={activeAssignment}
                  moved={activeAssignment.tableId !== activeAssignment.originalTableId}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : null}

      {showTableModal && snapshot && (
        <TableSetupModal
          weddingId={weddingId}
          tables={snapshot.tables}
          onClose={() => setShowTableModal(false)}
          onTablesChange={(tables) => setSnapshot({ ...snapshot, tables })}
        />
      )}
    </div>
  )
}
