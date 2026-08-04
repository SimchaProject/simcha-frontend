import { useEffect, useRef, useState } from 'react'
import { guestsApi } from '../../api/guests'
import type { Guest } from '../../types/guest'

interface Props {
  weddingId: string
  onClose: () => void
  onImported: (guests: Guest[]) => void
}

interface ParsedRow {
  name: string
  phone: string
  partySize: string
}

const HEADER_ALIASES: Record<string, 'name' | 'phone' | 'partySize'> = {
  name: 'name',
  'שם': 'name',
  'שם מלא': 'name',
  phone: 'phone',
  'טלפון': 'phone',
  partysize: 'partySize',
  'party size': 'partySize',
  'כמות': 'partySize',
  'מספר אורחים': 'partySize',
  'גודל קבוצה': 'partySize',
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }

    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export function CsvImportModal({ weddingId, onClose, onImported }: Props) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setParseError(null)
    setResult(null)
    const text = await file.text()
    const table = parseCsv(text)
    if (table.length < 1) {
      setParseError('הקובץ ריק.')
      setRows([])
      return
    }

    const header = table[0].map((h) => h.trim().toLowerCase())
    let nameCol = -1
    let phoneCol = -1
    let partySizeCol = -1
    header.forEach((h, i) => {
      const key = HEADER_ALIASES[h]
      if (key === 'name') nameCol = i
      else if (key === 'phone') phoneCol = i
      else if (key === 'partySize') partySizeCol = i
    })

    if (nameCol === -1) {
      setParseError('לא נמצאה עמודת שם בקובץ (השתמשו בכותרת "name" או "שם").')
      setRows([])
      return
    }

    const parsed = table
      .slice(1)
      .map((r) => ({
        name: (r[nameCol] ?? '').trim(),
        phone: phoneCol >= 0 ? (r[phoneCol] ?? '').trim() : '',
        partySize: partySizeCol >= 0 ? (r[partySizeCol] ?? '').trim() : '1',
      }))
      .filter((r) => r.name !== '')

    if (parsed.length === 0) {
      setParseError('לא נמצאו שורות עם שם תקין.')
    }
    setRows(parsed)
  }

  const handleImport = async () => {
    setImporting(true)
    let success = 0
    let failed = 0
    const created: Guest[] = []
    for (const r of rows) {
      try {
        const guest = await guestsApi.create(weddingId, {
          name: r.name,
          phone: r.phone || undefined,
          partySize: Number(r.partySize) || 1,
        })
        created.push(guest)
        success++
      } catch {
        failed++
      }
    }
    if (created.length > 0) onImported(created)
    setResult({ success, failed })
    setImporting(false)
  }

  return (
    <div className="dash-csv-modal-backdrop" onClick={onClose}>
      <div className="dash-csv-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="dash-csv-modal-close" onClick={onClose} aria-label="סגירה">
          ×
        </button>
        <p className="dash-page-title">ייבוא אורחים מ-CSV</p>
        <p className="dash-page-sub">
          קובץ עם שורת כותרת ועמודות name/phone/partySize (או שם/טלפון/כמות).
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="dash-csv-modal-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <button type="button" className="dash-guest-btn" onClick={() => fileInputRef.current?.click()}>
          {fileName ?? 'בחרו קובץ CSV'}
        </button>

        {parseError && <p className="dash-guest-error">{parseError}</p>}

        {rows.length > 0 && !result && (
          <>
            <p className="dash-page-sub" style={{ margin: '14px 0 6px' }}>
              נמצאו {rows.length} אורחים לייבוא:
            </p>
            <ul className="dash-csv-preview">
              {rows.slice(0, 8).map((r, i) => (
                <li key={i}>
                  <span>{r.name}</span>
                  <span dir="ltr">{r.phone || '—'}</span>
                  <span>{r.partySize || '1'}</span>
                </li>
              ))}
            </ul>
            {rows.length > 8 && <p className="dash-page-sub">ועוד {rows.length - 8} אורחים...</p>}
            <button
              type="button"
              className="dash-guest-btn"
              onClick={handleImport}
              disabled={importing}
              style={{ marginTop: 12 }}
            >
              {importing && <span className="dash-guest-spinner" />}
              ייבאו {rows.length} אורחים
            </button>
          </>
        )}

        {result && (
          <p className="dash-page-sub" style={{ marginTop: 14 }}>
            יובאו {result.success} אורחים בהצלחה
            {result.failed > 0 && ` (${result.failed} נכשלו)`}.
          </p>
        )}
      </div>
    </div>
  )
}
