import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { seatingApi } from '../api/seating'
import type { SeatingReport, SeatingSnapshot } from '../types/seating'
import { SeatingTableCard } from '../components/seating/SeatingTableCard'
import { UnseatedBucket, UNSEATED_DROPPABLE_ID } from '../components/seating/UnseatedBucket'
import { SeatingDiff } from '../components/seating/SeatingDiff'
import './SeatingPage.css'

export function SeatingPage() {
  const { weddingId } = useParams<{ weddingId: string }>()
  const [snapshot, setSnapshot] = useState<SeatingSnapshot | null>(null)
  const [report, setReport] = useState<SeatingReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)

  const load = () => {
    if (!weddingId) return
    seatingApi.getSnapshot(weddingId).then(setSnapshot).catch((e) => setError(String(e)))
  }

  useEffect(load, [weddingId])

  if (!weddingId) return <p>No wedding selected.</p>

  const runOptimize = async (reoptimize: boolean) => {
    setBusy(true)
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
      setBusy(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
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

  return (
    <div className="seating-page">
      <div className="seating-page__toolbar">
        <button onClick={() => runOptimize(false)} disabled={busy}>
          Run optimizer
        </button>
        <button onClick={() => runOptimize(true)} disabled={busy || !snapshot}>
          Re-optimize unlocked seats
        </button>
        <button onClick={() => setShowDiff((v) => !v)} disabled={!snapshot}>
          {showDiff ? 'Hide' : 'Show'} manual override diff
        </button>
      </div>

      {error && <p className="seating-page__error">{error}</p>}
      {report && (
        <p className="seating-page__report">
          Score {report.initialScore} → {report.finalScore} over {report.iterations} iterations (
          {report.durationMs}ms)
        </p>
      )}

      {showDiff && snapshot && <SeatingDiff tables={snapshot.tables} assignments={snapshot.assignments} />}

      {snapshot && (
        <DndContext onDragEnd={handleDragEnd}>
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
        </DndContext>
      )}
    </div>
  )
}
