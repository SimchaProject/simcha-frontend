import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { guestsApi } from '../api/guests'
import { weddingApi } from '../api/wedding'
import type { Guest, RsvpStatus } from '../types/guests'
import type { Wedding } from '../types/wedding'
import type { RsvpSubmittedEvent } from '../types/rsvp'
import { GuestRow } from '../components/guests/GuestRow'
import { GuestForm, type GuestFormValues } from '../components/guests/GuestForm'
import { ImportModal } from '../components/guests/ImportModal'
import { BulkWhatsAppBar } from '../components/guests/BulkWhatsAppBar'
import { RsvpLiveFeed } from '../components/guests/RsvpLiveFeed'
import '../components/guests/guests.css'
import './GuestListPage.css'

const MAX_RECENT_EVENTS = 20
const POLL_INTERVAL_MS = 8000

function toRsvpEvent(guest: Guest): RsvpSubmittedEvent {
  return {
    guestId: guest.id,
    name: guest.name,
    partySize: guest.partySize,
    rsvpStatus: guest.rsvpStatus,
    dietaryNotes: guest.dietaryNotes,
    respondedAt: guest.respondedAt ?? new Date().toISOString(),
    timestamp: new Date().toISOString(),
  }
}

type StatusFilter = RsvpStatus | 'ALL'

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'הכל',
  PENDING: 'ממתינים',
  ATTENDING: 'מגיעים',
  DECLINED: 'לא מגיעים',
}

export function GuestListPage() {
  const { weddingId } = useParams<{ weddingId: string }>()
  const [guests, setGuests] = useState<Guest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyGuestIds, setBusyGuestIds] = useState<Set<string>>(new Set())
  const [addingGuest, setAddingGuest] = useState(false)
  const [addBusy, setAddBusy] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [recentEvents, setRecentEvents] = useState<RsvpSubmittedEvent[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const previousGuestsRef = useRef<Guest[] | null>(null)

  // Needed to build the invite link embedded in bulk WhatsApp messages -
  // a reminder with no link gives the guest nothing to click through to.
  useEffect(() => {
    weddingApi.getMine().then(setWedding).catch(() => undefined)
  }, [])

  // Live updates are done by polling and diffing against the previous
  // snapshot (no Redis/SSE - simpler architecture, plenty fast enough at
  // guest-list scale).
  const load = () => {
    if (!weddingId) return
    guestsApi
      .list(weddingId)
      .then((fresh) => {
        const previous = previousGuestsRef.current
        if (previous) {
          const changed = fresh.filter((g) => {
            const old = previous.find((p) => p.id === g.id)
            return old && (old.rsvpStatus !== g.rsvpStatus || old.respondedAt !== g.respondedAt)
          })
          if (changed.length > 0) {
            setRecentEvents((prev) =>
              [...changed.map(toRsvpEvent), ...prev].slice(0, MAX_RECENT_EVENTS),
            )
          }
        }
        previousGuestsRef.current = fresh
        setGuests(fresh)
      })
      .catch((e) => setError(String(e)))
  }

  useEffect(load, [weddingId])

  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    if (!weddingId) return
    const interval = setInterval(() => loadRef.current(), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [weddingId])

  if (!weddingId) return <p className="guest-list-page__error">No wedding selected.</p>

  const setGuestBusy = (guestId: string, busy: boolean) => {
    setBusyGuestIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(guestId)
      else next.delete(guestId)
      return next
    })
  }

  const handleUpdate = async (guestId: string, values: GuestFormValues) => {
    if (!guests) return
    setGuestBusy(guestId, true)
    setError(null)
    try {
      const updated = await guestsApi.update(weddingId, guestId, {
        name: values.name,
        phone: values.phone || undefined,
        partySize: values.partySize,
      })
      setGuests(guests.map((g) => (g.id === guestId ? updated : g)))
    } catch (e) {
      setError(String(e))
    } finally {
      setGuestBusy(guestId, false)
    }
  }

  const handleDelete = async (guestId: string) => {
    if (!guests) return
    setGuestBusy(guestId, true)
    setError(null)
    try {
      await guestsApi.remove(weddingId, guestId)
      setGuests(guests.filter((g) => g.id !== guestId))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(guestId)
        return next
      })
    } catch (e) {
      setError(String(e))
      setGuestBusy(guestId, false)
    }
  }

  const toggleSelect = (guestId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(guestId)) next.delete(guestId)
      else next.add(guestId)
      return next
    })
  }

  const handleAdd = async (values: GuestFormValues) => {
    setAddBusy(true)
    setError(null)
    try {
      const created = await guestsApi.create(weddingId, {
        name: values.name,
        phone: values.phone || undefined,
        partySize: values.partySize,
      })
      setGuests((prev) => (prev ? [...prev, created] : [created]))
      setAddingGuest(false)
    } catch (e) {
      setError(String(e))
    } finally {
      setAddBusy(false)
    }
  }

  const counts = guests
    ? {
        total: guests.length,
        attending: guests.filter((g) => g.rsvpStatus === 'ATTENDING').length,
        declined: guests.filter((g) => g.rsvpStatus === 'DECLINED').length,
        pending: guests.filter((g) => g.rsvpStatus === 'PENDING').length,
      }
    : null

  const visibleGuests =
    guests && statusFilter !== 'ALL'
      ? guests.filter((g) => g.rsvpStatus === statusFilter)
      : guests

  return (
    <div className="guest-list-page">
      <header className="guest-list-page__header">
        <h1>רשימת אורחים</h1>
        {counts && (
          <p className="guest-list-page__subtitle">
            {counts.total} מוזמנים · {counts.attending} מגיעים · {counts.declined} לא מגיעים ·{' '}
            {counts.pending} ממתינים
          </p>
        )}
      </header>

      <RsvpLiveFeed events={recentEvents} />

      <div className="guest-list-page__toolbar">
        <button className="btn btn--primary" onClick={() => setAddingGuest((v) => !v)}>
          {addingGuest ? 'ביטול' : 'הוספת אורח'}
        </button>
        <button className="btn" onClick={() => setShowImportModal(true)}>
          ייבוא מקובץ CSV
        </button>
        <select
          className="guest-list-page__status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_FILTER_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {showImportModal && (
        <ImportModal
          weddingId={weddingId}
          onClose={() => setShowImportModal(false)}
          onImported={load}
        />
      )}

      {addingGuest && (
        <div className="guest-list-page__add-form">
          <GuestForm
            busy={addBusy}
            submitLabel="הוספה"
            onCancel={() => setAddingGuest(false)}
            onSubmit={handleAdd}
          />
        </div>
      )}

      {error && <p className="guest-list-page__error">{error}</p>}

      {selectedIds.size > 0 && guests && wedding && (
        <BulkWhatsAppBar
          guests={guests.filter((g) => selectedIds.has(g.id))}
          onClear={() => setSelectedIds(new Set())}
          coupleNameA={wedding.coupleNameA}
          coupleNameB={wedding.coupleNameB}
          inviteUrl={`${window.location.origin}/w/${wedding.slug}`}
        />
      )}

      {visibleGuests === null ? (
        <p className="guest-list-page__empty">טוען...</p>
      ) : visibleGuests.length === 0 ? (
        <p className="guest-list-page__empty">
          {guests?.length ? 'אין אורחים התואמים לסינון.' : 'עדיין אין אורחים ברשימה.'}
        </p>
      ) : (
        <ul className="guest-list">
          {visibleGuests.map((guest) => (
            <GuestRow
              key={guest.id}
              guest={guest}
              busy={busyGuestIds.has(guest.id)}
              selected={selectedIds.has(guest.id)}
              onToggleSelect={() => toggleSelect(guest.id)}
              onUpdate={(values) => handleUpdate(guest.id, values)}
              onDelete={() => handleDelete(guest.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
