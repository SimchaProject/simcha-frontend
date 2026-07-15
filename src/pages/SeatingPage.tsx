import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { seatingApi } from '../api/seating'
import type { SeatingReport, SeatingSnapshot } from '../types/seating'
import { SeatingTableCard } from '../components/seating/SeatingTableCard'
import { UnseatedBucket, UNSEATED_DROPPABLE_ID } from '../components/seating/UnseatedBucket'
import { SeatingDiff } from '../components/seating/SeatingDiff'
import { GuestChipContent } from '../components/seating/GuestChip'
import './SeatingPage.css'

type BusyAction = 'optimize' | 'reoptimize' | null

export function SeatingPage() {
  const { weddingId } = useParams<{ weddingId: string }>()
  const [snapshot, setSnapshot] = useState<SeatingSnapshot | null>(null)
  const [report, setReport] = useState<SeatingReport | null>(null)
  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const load = () => {
    if (!weddingId) return
    seatingApi.getSnapshot(weddingId).then(setSnapshot).catch((e) => setError(String(e)))
  }

  useEffect(load, [weddingId])

  if (!weddingId) return <p className="seating-page__error">No wedding selected.</p>

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || !snapshot) return

    const assignment = snapshot.assignments.find((a) => a.id === active.id)
    if (!assignment) return

    const newTableId = over.id === UNSEATED_DROPPABLE_ID ? null : String(over.id)
    if (newTableId === assignment.tableId) return

    const previous = snapshot
    setSnapshot({
      ...snapshot,
      assignments: snapshot.assignments.map((a) =>
        a.id === assignment.id ? { ...a, tableId: newTableId, locked: true } : a,
      ),
    })

    try {
      await seatingApi.overrideAssignment(weddingId, assignment.id, newTableId)
    } catch (e) {
      setError(String(e))
      setSnapshot(previous)
    }
  }

  const activeAssignment = snapshot?.assignments.find((a) => a.id === activeId)

  return (
    <div className="seating-page">
      <header className="seating-page__header">
        <h1>Seating Chart</h1>
        {snapshot && (
          <p className="seating-page__subtitle">
            {snapshot.assignments.length} guests · {snapshot.tables.length} tables
          </p>
        )}
      </header>

      <div className="seating-page__toolbar">
        <button
          className="btn btn--primary"
          onClick={() => runOptimize(false)}
          disabled={busyAction !== null}
        >
          {busyAction === 'optimize' && <span className="spinner" />}
          Run optimizer
        </button>
        <button
          className="btn"
          onClick={() => runOptimize(true)}
          disabled={busyAction !== null || !snapshot}
        >
          {busyAction === 'reoptimize' && <span className="spinner" />}
          Re-optimize unlocked seats
        </button>
        <button className="btn btn--ghost" onClick={() => setShowDiff((v) => !v)} disabled={!snapshot}>
          {showDiff ? 'Hide' : 'Show'} manual override diff
        </button>
      </div>

      {error && <p className="seating-page__error">{error}</p>}
      {report && (
        <p className="seating-page__report">
          Score <strong>{report.initialScore}</strong> → <strong>{report.finalScore}</strong> over{' '}
          {report.iterations} iterations ({report.durationMs}ms)
        </p>
      )}

      <div className={`seating-diff-wrapper${showDiff ? ' is-open' : ''}`}>
        {snapshot && <SeatingDiff tables={snapshot.tables} assignments={snapshot.assignments} />}
      </div>

      {snapshot ? (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="seating-page__tables">
            {snapshot.tables.map((table) => (
              <SeatingTableCard
                key={table.id}
                table={table}
                assignments={snapshot.assignments.filter((a) => a.tableId === table.id)}
              />
            ))}
          </div>
          <UnseatedBucket assignments={snapshot.assignments.filter((a) => a.tableId === null)} />

          <DragOverlay>
            {activeAssignment && (
              <div className="guest-chip guest-chip--overlay">
                <GuestChipContent
                  assignment={activeAssignment}
                  moved={activeAssignment.tableId !== activeAssignment.originalTableId}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="seating-page__empty-state">
          <p>No seating data yet.</p>
          <p>Click "Run optimizer" to generate the first layout.</p>
        </div>
      )}
    </div>
  )
}
