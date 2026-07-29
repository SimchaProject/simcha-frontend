import { useState } from 'react'
import type { Guest } from '../../types/guests'
import { RsvpStatusBadge } from './RsvpStatusBadge'
import { ReminderButton } from './ReminderButton'
import { GuestForm, type GuestFormValues } from './GuestForm'

interface GuestRowProps {
  guest: Guest
  busy: boolean
  selected: boolean
  onToggleSelect: () => void
  onUpdate: (values: GuestFormValues) => Promise<void>
  onDelete: () => void
}

export function GuestRow({
  guest,
  busy,
  selected,
  onToggleSelect,
  onUpdate,
  onDelete,
}: GuestRowProps) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <li className="guest-row guest-row--editing">
        <GuestForm
          initial={{ name: guest.name, phone: guest.phone ?? '', partySize: guest.partySize }}
          busy={busy}
          submitLabel="שמירה"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(values)
            setEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="guest-row">
      <div className="guest-row__info">
        <input
          type="checkbox"
          className="guest-row__checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`בחירת ${guest.name}`}
        />
        <span className="guest-row__name">{guest.name}</span>
        <span className="guest-row__phone">{guest.phone ?? '—'}</span>
        <span className="guest-row__party">{guest.partySize} סועדים</span>
        <RsvpStatusBadge status={guest.rsvpStatus} />
        {guest.dietaryNotes && (
          <span className="guest-row__dietary" title={guest.dietaryNotes}>
            🍽️
          </span>
        )}
        {guest.needsTransport && (
          <span className="guest-row__transport" title="צריך/ה הסעה מאורגנת">
            🚌
          </span>
        )}
      </div>
      <div className="guest-row__actions">
        <ReminderButton guest={guest} />
        <button className="btn btn--ghost" onClick={() => setEditing(true)} disabled={busy}>
          עריכה
        </button>
        <button className="btn btn--ghost" onClick={onDelete} disabled={busy}>
          {busy && <span className="spinner" />}
          מחיקה
        </button>
      </div>
    </li>
  )
}
