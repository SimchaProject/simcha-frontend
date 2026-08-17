import { useState } from 'react'
import { constraintsApi } from '../../api/constraints'
import type { ParsedConstraint } from '../../types/constraints'

interface ConstraintAssistantProps {
  weddingId: string
  onApplied: () => void
}

const TYPE_LABELS: Record<ParsedConstraint['type'], string> = {
  MUST_SIT_TOGETHER: 'לשבת יחד',
  MUST_AVOID: 'לא לשבת יחד',
}

export function ConstraintAssistant({ weddingId, onApplied }: ConstraintAssistantProps) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedConstraint[] | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [parsing, setParsing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleParse = async () => {
    if (!text.trim()) return
    setParsing(true)
    setError(null)
    setParsed(null)
    try {
      const result = await constraintsApi.parse(weddingId, text.trim())
      setParsed(result.constraints)
      setSelected(new Set(result.constraints.map((_, i) => i)))
    } catch {
      setError('לא הצלחנו לנתח את הבקשה, נסו לנסח אחרת.')
    } finally {
      setParsing(false)
    }
  }

  const toggleSelected = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleApply = async () => {
    if (!parsed) return
    setApplying(true)
    setError(null)
    try {
      const toApply = parsed.filter((_, i) => selected.has(i))
      for (const constraint of toApply) {
        await constraintsApi.create(weddingId, {
          type: constraint.type,
          participants: constraint.participants.map((p) => ({ guestId: p.guestId })),
        })
      }
      setParsed(null)
      setText('')
      onApplied()
    } catch {
      setError('לא הצלחנו לשמור את ההגבלות.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="dash-constraint-assistant">
      <p className="dash-constraint-assistant__label">עוזר הושבה חכם</p>
      <p className="dash-page-sub">
        כתבו בחופשיות, לדוגמה: "תשבו את משפחת כהן ביחד, ודן ונועה לא ביחד"
      </p>
      <div className="dash-constraint-assistant__input-row">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="מי צריך לשבת ביחד, ומי לא?"
        />
        <button
          type="button"
          className="dash-seating__btn"
          onClick={handleParse}
          disabled={parsing || !text.trim()}
        >
          {parsing ? 'מנתחים...' : 'נתחו'}
        </button>
      </div>

      {error && <p className="dash-guest-error">{error}</p>}

      {parsed && (
        <div className="dash-constraint-assistant__preview">
          {parsed.length === 0 ? (
            <p className="dash-page-sub">לא זיהינו הגבלות בבקשה. נסו לציין שמות מדויקים יותר.</p>
          ) : (
            <>
              {parsed.map((constraint, i) => (
                <label key={i} className="dash-constraint-assistant__item">
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelected(i)} />
                  <span>
                    {TYPE_LABELS[constraint.type]}: {constraint.participants.map((p) => p.name).join(', ')}
                  </span>
                </label>
              ))}
              <button
                type="button"
                className="dash-seating__btn"
                onClick={handleApply}
                disabled={applying || selected.size === 0}
              >
                {applying ? 'מחילים...' : `החילו (${selected.size})`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
