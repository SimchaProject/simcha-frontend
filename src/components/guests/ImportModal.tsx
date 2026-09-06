import { useRef, useState } from 'react'
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

const EXCEL_EXTENSION = /\.xlsx?$/i

// Mirrors the backend's Hebrew header aliases (csv-row.dto.ts) so this
// preview doesn't flag a CSV as broken that the real import - the source of
// truth - would actually accept fine.
const FIELD_ALIASES: Record<string, string[]> = {
  name: ['name', 'שם', 'שם מלא', 'שם האורח', 'שם אורח'],
  phone: ['phone', 'טלפון', 'נייד', 'טלפון נייד', 'מספר טלפון', 'פלאפון'],
}

// What the file needs to look like, kept in step with FIELD_ALIASES and the
// validation in csv-row.dto.ts. A couple gets handed a spreadsheet by a
// family member and has no idea what we accept - saying so up front is
// cheaper than letting them find out one failed import at a time.
const COLUMNS: { header: string; required: boolean; note: string }[] = [
  { header: 'שם', required: true, note: 'שם האורח או המשפחה. השורה מדולגת בלעדיו.' },
  { header: 'טלפון', required: false, note: '10 ספרות שמתחילות ב-0. בלעדיו האורח לא יקבל הזמנה.' },
  { header: 'כמות', required: false, note: 'מספר הסועדים ברשומה. ריק נחשב 1.' },
  { header: 'קבוצה', required: false, note: 'למשל "משפחת לוי" — קבוצה שלא קיימת תיווצר לבד.' },
]

const SAMPLE_ROWS = [
  ['שם', 'טלפון', 'כמות', 'קבוצה'],
  ['דנה לוי', '0521110001', '2', 'משפחת לוי'],
  ['אבי כהן', '0521110002', '1', 'חברים מהעבודה'],
  ['משפחת אזולאי', '0521110003', '4', 'משפחת אזולאי'],
]

function getField(record: Record<string, string>, field: string): string {
  const aliases = FIELD_ALIASES[field] ?? [field]
  const key = Object.keys(record).find((k) => aliases.includes(k.trim().toLowerCase()))
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

// A file the couple can open, overwrite with their own list, and send back -
// far more use than a description of the format on its own. The BOM is what
// makes Excel read the Hebrew headers as UTF-8 instead of mojibake; written
// as an escape rather than a literal so it can't be mistaken for a stray
// invisible character (and so the linter doesn't flag it as one).
const UTF8_BOM = String.fromCharCode(0xfeff)

function downloadSample() {
  const csv = SAMPLE_ROWS.map((row) => row.join(',')).join('\n')
  const blob = new Blob([`${UTF8_BOM}${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'simcha-guests-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

interface ImportModalProps {
  weddingId: string
  onClose: () => void
  onImported: () => void
}

// Client-side parsing here is purely a preview/UX aid - the raw file is what
// actually gets sent, the backend is the source of truth for real import
// validation and dedup. Name/phone header aliases are mirrored above so the
// preview doesn't wrongly flag a valid Hebrew-header CSV as broken, but
// title-row detection isn't replicated - a leading title row can still make
// this preview look wrong even though the real import handles it fine.
export function ImportModal({ weddingId, onClose, onImported }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [isExcel, setIsExcel] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (selected: File | null) => {
    setFile(selected)
    setResult(null)
    setError(null)
    setPreviewRows(null)
    if (!selected) return

    // Papa.parse only understands CSV text - Excel's binary format gets a
    // simple "file selected" state instead of a row-by-row preview. The
    // backend still parses and validates the actual file either way.
    if (EXCEL_EXTENSION.test(selected.name)) {
      setIsExcel(true)
      return
    }
    setIsExcel(false)

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
        <h2>ייבוא אורחים מקובץ</h2>

        {!result && (
          <>
            {/* The real input stays in the DOM but hidden: browsers won't let
                its "Choose file / no file selected" chrome be styled, and it
                renders in the browser's language rather than Hebrew. */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="import-dropzone__input"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            <div
              className={`import-dropzone${dragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                handleFile(e.dataTransfer.files?.[0] ?? null)
              }}
            >
              <span className="import-dropzone__icon" aria-hidden="true">
                {file ? '📄' : '⬆'}
              </span>
              {file ? (
                <>
                  <span className="import-dropzone__filename">{file.name}</span>
                  <span className="import-dropzone__hint">לחצו כדי להחליף קובץ</span>
                </>
              ) : (
                <>
                  <span className="import-dropzone__filename">גררו קובץ לכאן, או לחצו לבחירה</span>
                  <span className="import-dropzone__hint">CSV · Excel (xlsx/xls)</span>
                </>
              )}
            </div>

            <details className="import-format" open={!file}>
              <summary>איך הקובץ צריך להיראות?</summary>
              <div className="import-format__body">
                <p className="import-format__lead">
                  שורה ראשונה היא שורת כותרות, ומתחתיה שורה לכל אורח. הכותרות יכולות להיות בעברית או
                  באנגלית, והסדר לא משנה — מזהים לפי השם של העמודה.
                </p>

                <table className="import-format__table">
                  <thead>
                    <tr>
                      <th>עמודה</th>
                      <th>חובה?</th>
                      <th>מה נכנס בה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COLUMNS.map((column) => (
                      <tr key={column.header}>
                        <td>
                          <code>{column.header}</code>
                        </td>
                        <td>{column.required ? 'חובה' : 'רשות'}</td>
                        <td>{column.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="import-format__lead">דוגמה:</p>
                <table className="import-format__sample">
                  <tbody>
                    {SAMPLE_ROWS.map((row, i) => (
                      <tr key={i} className={i === 0 ? 'is-header' : undefined}>
                        {/* Keyed by column index, not by value: a guest's
                            surname legitimately repeats as their group name
                            in the same row. */}
                        {row.map((cell, column) => (
                          <td key={column}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <ul className="import-format__notes">
                  <li>אפשר להשאיר שורת כותרת עליונה (״רשימת אורחים לחתונה של…״) — נזהה את שורת העמודות לבדה.</li>
                  <li>מקובץ Excel נקרא הגיליון הראשון בלבד.</li>
                  <li>
                    ייבוא חוזר מזהה אורח לפי הטלפון ומעדכן אותו במקום לכפול — ואף פעם לא דורס תשובת
                    אישור הגעה שכבר התקבלה.
                  </li>
                </ul>

                <button type="button" className="import-format__download" onClick={downloadSample}>
                  הורדת קובץ לדוגמה
                </button>
              </div>
            </details>
          </>
        )}

        {isExcel && file && !result && (
          <p className="import-modal__preview-summary">
            קובץ Excel נבחר — כל השורות ייבדקו בשרת בעת הייבוא.
          </p>
        )}

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
            <button type="button" className="dash-btn dash-btn--primary" onClick={onClose}>
              סגירה
            </button>
          ) : (
            <>
              <button
                type="button"
                className="dash-btn dash-btn--primary"
                onClick={handleConfirm}
                disabled={!file || busy}
              >
                {busy && <span className="dash-guest-spinner" />}
                ייבוא
              </button>
              <button type="button" className="dash-btn" onClick={onClose} disabled={busy}>
                ביטול
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
