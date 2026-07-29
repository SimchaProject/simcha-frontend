import { useState } from 'react'
import Papa from 'papaparse'
import { guestsApi } from '../../api/guests'
import type { BulkImportResult } from '../../types/guests'
import { isValidIsraeliMobile } from '../../utils/phone'
import './import-modal.css'

interface PreviewRow {
  row: number
  name: string
  phone: string
  ok: boolean
  reason?: string
}

function getField(record: Record<string, string>, field: string): string {
  const key = Object.keys(record).find((k) => k.trim().toLowerCase() === field)
  return key ? (record[key] ?? '').trim() : ''
}

function buildPreviewRow(record: Record<string, string>, row: number): PreviewRow {
  const name = getField(record, 'name')
  const phone = getField(record, 'phone')
  if (!name) return { row, name, phone, ok: false, reason: 'חסר שם' }
  if (phone && !isValidIsraeliMobile(phone)) {
    return { row, name, phone, ok: false, reason: 'מספר טלפון לא תקין' }
  }
  return { row, name, phone, ok: true }
}

interface ImportModalProps {
  weddingId: string
  onClose: () => void
  onImported: () => void
}

// Client-side parsing here is purely a preview/UX aid - the raw file is what
// actually gets sent, the backend is the source of truth for real import
// validation and dedup.
export function ImportModal({ weddingId, onClose, onImported }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkImportResult | null>(null)

  const handleFile = (selected: File | null) => {
    setFile(selected)
    setResult(null)
    setError(null)
    setPreviewRows(null)
    if (!selected) return

    Papa.parse<Record<string, string>>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreviewRows(results.data.map((record, i) => buildPreviewRow(record, i + 1)))
      },
      error: () => setError('לא הצלחנו לקרוא את הקובץ'),
    })
  }

  const handleConfirm = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const importResult = await guestsApi.bulkImport(weddingId, file)
      setResult(importResult)
      onImported()
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  const invalidCount = previewRows?.filter((r) => !r.ok).length ?? 0

  return (
    <div className="import-modal-overlay" onClick={onClose}>
      <div className="import-modal" onClick={(e) => e.stopPropagation()}>
        <h2>ייבוא אורחים מקובץ CSV</h2>
        <p className="import-modal__hint">קובץ Excel? שמרו כ-CSV לפני ההעלאה.</p>

        <input type="file" accept=".csv" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />

        {previewRows && !result && (
          <div className="import-modal__preview">
            <p className="import-modal__preview-summary">
              {previewRows.length} שורות ·{' '}
              {invalidCount > 0 ? `${invalidCount} עם בעיה` : 'הכל תקין'}
            </p>
            <ul className="import-modal__preview-list">
              {previewRows.slice(0, 20).map((row) => (
                <li key={row.row} className={row.ok ? '' : 'import-modal__row--invalid'}>
                  #{row.row} {row.name || '(ללא שם)'} {row.phone && `· ${row.phone}`}
                  {row.reason && ` · ${row.reason}`}
                </li>
              ))}
            </ul>
            {previewRows.length > 20 && (
              <p className="import-modal__preview-more">
                ועוד {previewRows.length - 20} שורות...
              </p>
            )}
          </div>
        )}

        {error && <p className="import-modal__error">{error}</p>}

        {result && (
          <div className="import-modal__result">
            <p>
              נוספו {result.importedCount} · עודכנו {result.updatedCount} · דולגו{' '}
              {result.skippedCount}
            </p>
            {result.errors.length > 0 && (
              <ul className="import-modal__preview-list">
                {result.errors.map((e) => (
                  <li key={e.row} className="import-modal__row--invalid">
                    שורה {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="import-modal__actions">
          {result ? (
            <button className="btn btn--primary" onClick={onClose}>
              סגירה
            </button>
          ) : (
            <>
              <button
                className="btn btn--primary"
                onClick={handleConfirm}
                disabled={!file || busy}
              >
                {busy && <span className="spinner" />}
                ייבוא
              </button>
              <button className="btn btn--ghost" onClick={onClose} disabled={busy}>
                ביטול
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
