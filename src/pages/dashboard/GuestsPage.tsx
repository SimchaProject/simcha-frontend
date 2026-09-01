import { useEffect, useMemo, useRef, useState } from 'react'
import { useDashboard } from './dashboard-context'
import { guestsApi } from '../../api/guests'
import { guestGroupsApi } from '../../api/guestGroups'
import type { Guest, GuestGroup, RsvpStatus } from '../../types/guests'
import type { RsvpSubmittedEvent } from '../../types/rsvp'
import { ImportModal } from '../../components/guests/ImportModal'
import { InviteModal } from '../../components/guests/InviteModal'
import { RsvpLiveFeed } from '../../components/guests/RsvpLiveFeed'
import './guests.css'

const STATUS_LABELS: Record<RsvpStatus, string> = {
  PENDING: 'ממתין',
  ATTENDING: 'מאושר',
  DECLINED: 'לא מגיע',
}

// The dropdown's CSS was authored against the older pending/confirmed/declined
// vocabulary - map to it here rather than rename those style rules.
const STATUS_CSS_SUFFIX: Record<RsvpStatus, string> = {
  PENDING: 'pending',
  ATTENDING: 'confirmed',
  DECLINED: 'declined',
}

const POLL_INTERVAL_MS = 8000
const MAX_RECENT_EVENTS = 20

const NO_GROUP = ''

interface GuestDraft {
  name: string
  phone: string
  partySize: string
  groupId: string
}

const emptyDraft: GuestDraft = { name: '', phone: '', partySize: '1', groupId: NO_GROUP }

type SortKey = 'name' | 'partySize' | 'rsvpStatus'

function guestPayload(draft: GuestDraft) {
  return {
    name: draft.name.trim(),
    phone: draft.phone.trim() || undefined,
    partySize: Number(draft.partySize) || 1,
    groupId: draft.groupId || null,
  }
}

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

export function GuestsPage() {
  const { wedding } = useDashboard()
  const [guests, setGuests] = useState<Guest[]>([])
  const [groups, setGroups] = useState<GuestGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentEvents, setRecentEvents] = useState<RsvpSubmittedEvent[]>([])
  const previousGuestsRef = useRef<Guest[] | null>(null)

  const [newGuest, setNewGuest] = useState<GuestDraft>(emptyDraft)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<GuestDraft>(emptyDraft)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RsvpStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [groupView, setGroupView] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showAddRow, setShowAddRow] = useState(false)

  const load = () => {
    guestsApi.list(wedding.id).then((fresh) => {
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
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([guestsApi.list(wedding.id), guestGroupsApi.list(wedding.id)])
      .then(([guestList, groupList]) => {
        if (cancelled) return
        previousGuestsRef.current = guestList
        setGuests(guestList)
        setGroups(groupList)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError('לא הצלחנו לטעון את רשימת האורחים.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [wedding.id])

  // Live updates via polling + diffing against the previous snapshot - no
  // Redis/SSE, plenty fast enough at guest-list scale.
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })
  useEffect(() => {
    const interval = setInterval(() => loadRef.current(), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const stats = useMemo(() => {
    const confirmed = guests.filter((g) => g.rsvpStatus === 'ATTENDING')
    const pending = guests.filter((g) => g.rsvpStatus === 'PENDING')
    const declined = guests.filter((g) => g.rsvpStatus === 'DECLINED')
    return {
      total: guests.length,
      totalParty: guests.reduce((sum, g) => sum + g.partySize, 0),
      confirmed: confirmed.length,
      confirmedParty: confirmed.reduce((sum, g) => sum + g.partySize, 0),
      pending: pending.length,
      pendingParty: pending.reduce((sum, g) => sum + g.partySize, 0),
      declined: declined.length,
    }
  }, [guests])

  const visibleGuests = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = guests.filter((g) => {
      if (statusFilter !== 'all' && g.rsvpStatus !== statusFilter) return false
      if (!term) return true
      return g.name.toLowerCase().includes(term) || (g.phone ?? '').includes(term)
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'he') * dir
      if (sortKey === 'partySize') return (a.partySize - b.partySize) * dir
      return a.rsvpStatus.localeCompare(b.rsvpStatus) * dir
    })
  }, [guests, search, statusFilter, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '')

  const handleAdd = async () => {
    if (!newGuest.name.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const created = await guestsApi.create(wedding.id, guestPayload(newGuest))
      setGuests((prev) => [...prev, created])
      previousGuestsRef.current = [...(previousGuestsRef.current ?? []), created]
      // Keep the row open between adds - entering a guest list is a repeated
      // action, and re-opening the panel for each name would be worse than
      // leaving it up.
      setNewGuest(emptyDraft)
    } catch {
      setAddError('נא לוודא שהשם והטלפון תקינים.')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (guest: Guest) => {
    setEditingId(guest.id)
    setEditDraft({
      name: guest.name,
      phone: guest.phone ?? '',
      partySize: String(guest.partySize),
      groupId: guest.groupId ?? NO_GROUP,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(emptyDraft)
  }

  const saveEdit = async (guestId: string) => {
    try {
      const updated = await guestsApi.update(wedding.id, guestId, guestPayload(editDraft))
      setGuests((prev) => prev.map((g) => (g.id === guestId ? updated : g)))
      cancelEdit()
    } catch {
      setError('לא הצלחנו לשמור את השינוי.')
    }
  }

  const handleStatusChange = async (guestId: string, rsvpStatus: RsvpStatus) => {
    const updated = await guestsApi.update(wedding.id, guestId, { rsvpStatus })
    setGuests((prev) => prev.map((g) => (g.id === guestId ? updated : g)))
  }

  const handleDelete = async (guestId: string) => {
    if (!window.confirm('להסיר את האורח מהרשימה?')) return
    await guestsApi.remove(wedding.id, guestId)
    setGuests((prev) => prev.filter((g) => g.id !== guestId))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(guestId)
      return next
    })
  }

  const toggleSelect = (guestId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(guestId)) next.delete(guestId)
      else next.add(guestId)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) =>
      visibleGuests.every((g) => prev.has(g.id)) ? new Set() : new Set(visibleGuests.map((g) => g.id)),
    )
  }

  const bulkSetStatus = async (rsvpStatus: RsvpStatus) => {
    const ids = [...selectedIds]
    const updated = await Promise.all(ids.map((id) => guestsApi.update(wedding.id, id, { rsvpStatus })))
    setGuests((prev) => prev.map((g) => updated.find((u) => u.id === g.id) ?? g))
  }

  const bulkDelete = async () => {
    if (!window.confirm(`להסיר ${selectedIds.size} אורחים מהרשימה?`)) return
    const ids = [...selectedIds]
    await Promise.all(ids.map((id) => guestsApi.remove(wedding.id, id)))
    setGuests((prev) => prev.filter((g) => !ids.includes(g.id)))
    setSelectedIds(new Set())
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    const created = await guestGroupsApi.create(wedding.id, { name: newGroupName.trim() })
    setGroups((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'he')))
    setNewGroupName('')
  }

  const handleRenameGroup = async (groupId: string, name: string) => {
    if (!name.trim()) return
    const updated = await guestGroupsApi.update(wedding.id, groupId, { name: name.trim() })
    setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)))
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('להסיר את הקבוצה? האורחים בה יישארו ברשימה ללא שיוך לקבוצה.')) return
    await guestGroupsApi.remove(wedding.id, groupId)
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
    setGuests((prev) => prev.map((g) => (g.groupId === groupId ? { ...g, groupId: null } : g)))
  }

  const renderRow = (guest: Guest) => (
    <tr key={guest.id}>
      <td className="dash-guest-table__checkbox">
        <input
          type="checkbox"
          checked={selectedIds.has(guest.id)}
          onChange={() => toggleSelect(guest.id)}
          aria-label={`בחרו את ${guest.name}`}
        />
      </td>
      {editingId === guest.id ? (
        <>
          <td>
            <input
              type="text"
              value={editDraft.name}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
            />
          </td>
          <td>
            <input
              type="tel"
              dir="ltr"
              value={editDraft.phone}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </td>
          <td>
            <input
              type="number"
              min="1"
              value={editDraft.partySize}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, partySize: e.target.value }))}
            />
          </td>
          <td>
            <select
              value={editDraft.groupId}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, groupId: e.target.value }))}
            >
              <option value={NO_GROUP}>ללא קבוצה</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </td>
          <td colSpan={2}>
            <div className="dash-guest-table__edit-actions">
              <button type="button" onClick={() => saveEdit(guest.id)}>
                שמרו
              </button>
              <button type="button" onClick={cancelEdit}>
                ביטול
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td>
            {guest.name}
            {guest.dietaryNotes && (
              <span className="dash-guest-note" title={guest.dietaryNotes}>
                🍽️
              </span>
            )}
            {guest.needsTransport && (
              <span className="dash-guest-note" title="צריך/ה הסעה מאורגנת">
                🚌
              </span>
            )}
            {guest.openToMingle && (
              <span className="dash-guest-note" title="הצטרף/ה לפינת הרווקים">
                ✨
              </span>
            )}
          </td>
          <td dir="ltr">{guest.phone ?? '—'}</td>
          <td>{guest.partySize}</td>
          <td>{groups.find((g) => g.id === guest.groupId)?.name ?? '—'}</td>
          <td>
            <select
              className={`dash-status-select dash-status-select--${STATUS_CSS_SUFFIX[guest.rsvpStatus]}`}
              value={guest.rsvpStatus}
              onChange={(e) => handleStatusChange(guest.id, e.target.value as RsvpStatus)}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </td>
          <td>
            <div className="dash-guest-table__actions">
              <button type="button" onClick={() => startEdit(guest)}>
                ערכו
              </button>
              <button type="button" onClick={() => handleDelete(guest.id)}>
                הסירו
              </button>
            </div>
          </td>
        </>
      )}
    </tr>
  )

  const tableHeader = (
    <thead>
      <tr>
        <th className="dash-guest-table__checkbox">
          <input
            type="checkbox"
            checked={visibleGuests.length > 0 && visibleGuests.every((g) => selectedIds.has(g.id))}
            onChange={toggleSelectAllVisible}
            aria-label="בחרו הכל"
          />
        </th>
        <th className="dash-guest-table__sortable" onClick={() => handleSort('name')}>
          שם{sortIndicator('name')}
        </th>
        <th>טלפון</th>
        <th className="dash-guest-table__sortable" onClick={() => handleSort('partySize')}>
          כמות{sortIndicator('partySize')}
        </th>
        <th>קבוצה</th>
        <th className="dash-guest-table__sortable" onClick={() => handleSort('rsvpStatus')}>
          סטטוס{sortIndicator('rsvpStatus')}
        </th>
        <th />
      </tr>
    </thead>
  )

  const groupedSections = useMemo(() => {
    if (!groupView) return null
    const byGroup = new Map<string, Guest[]>()
    const ungrouped: Guest[] = []
    for (const guest of visibleGuests) {
      if (!guest.groupId) {
        ungrouped.push(guest)
        continue
      }
      const list = byGroup.get(guest.groupId) ?? []
      list.push(guest)
      byGroup.set(guest.groupId, list)
    }
    return { byGroup, ungrouped }
  }, [groupView, visibleGuests])

  if (loading) {
    return (
      <div className="dash-guests">
        <div className="dash-page-header">
          <p className="dash-page-title">אורחים</p>
        </div>
        <div className="dash-page-loading">
          <span className="dash-loading__spinner" aria-hidden="true" />
        </div>
      </div>
    )
  }

  return (
    <div className="dash-guests">
      <div className="dash-page-header dash-page-header--row">
        <div>
          <p className="dash-page-title">אורחים</p>
          <p className="dash-page-sub">
            {stats.total} רשומות · {stats.totalParty} באי חתונה
          </p>
        </div>
        <div className="dash-page-actions">
          <button type="button" className="dash-btn" onClick={() => setShowCsvModal(true)}>
            ייבוא מ-CSV
          </button>
          <button type="button" className="dash-btn" onClick={() => setShowInviteModal(true)}>
            שליחה בוואטסאפ
          </button>
          <button
            type="button"
            className="dash-btn dash-btn--primary"
            onClick={() => setShowAddRow((v) => !v)}
          >
            {showAddRow ? 'סגירה' : '+ הוספת אורח'}
          </button>
        </div>
      </div>

      <RsvpLiveFeed events={recentEvents} />

      {/* Three figures that actually drive a decision. The list total and the
          head count moved up into the page subtitle - they're context, not
          numbers anyone acts on. */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card dash-stat-card--good">
          <p className="dash-stat-card__label">אישרו הגעה</p>
          <p className="dash-stat-card__value">{stats.confirmedParty}</p>
          <p className="dash-stat-card__note">{stats.confirmed} רשומות</p>
        </div>
        <div className="dash-stat-card">
          <p className="dash-stat-card__label">ממתינים לתשובה</p>
          <p className="dash-stat-card__value">{stats.pending}</p>
          <p className="dash-stat-card__note">{stats.pendingParty} מוזמנים</p>
        </div>
        <div className="dash-stat-card dash-stat-card--alert">
          <p className="dash-stat-card__label">לא מגיעים</p>
          <p className="dash-stat-card__value">{stats.declined}</p>
          <p className="dash-stat-card__note">רשומות</p>
        </div>
      </div>

      {showAddRow && (
        <div className="dash-panel">
          <p className="dash-panel__title">אורח חדש</p>
          <div className="dash-guest-add-row">
            <input
              type="text"
              placeholder="שם מלא"
              autoFocus
              value={newGuest.name}
              onChange={(e) => setNewGuest((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              type="tel"
              placeholder="טלפון (לא חובה)"
              dir="ltr"
              value={newGuest.phone}
              onChange={(e) => setNewGuest((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <input
              type="number"
              min="1"
              placeholder="כמות"
              value={newGuest.partySize}
              onChange={(e) => setNewGuest((prev) => ({ ...prev, partySize: e.target.value }))}
            />
            <select
              value={newGuest.groupId}
              onChange={(e) => setNewGuest((prev) => ({ ...prev, groupId: e.target.value }))}
            >
              <option value={NO_GROUP}>ללא קבוצה</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleAdd} disabled={adding || !newGuest.name.trim()}>
              הוסיפו
            </button>
          </div>
          {addError && <p className="dash-guest-error">{addError}</p>}
        </div>
      )}

      <div className="dash-guest-toolbar">
        <input
          type="text"
          className="dash-guest-toolbar__search"
          placeholder="חיפוש לפי שם או טלפון..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RsvpStatus | 'all')}>
          <option value="all">כל הסטטוסים</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`dash-guest-toolbar__toggle${groupView ? ' is-active' : ''}`}
          onClick={() => setGroupView((v) => !v)}
        >
          קיבוץ לפי משפחה
        </button>
      </div>

      {groupView && (
        <div className="dash-group-manager">
          <input
            type="text"
            placeholder="שם קבוצה חדשה"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button type="button" onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
            + קבוצה חדשה
          </button>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="dash-bulk-bar">
          <span>{selectedIds.size} נבחרו</span>
          <button type="button" onClick={() => bulkSetStatus('ATTENDING')}>
            סמנו כמאושר
          </button>
          <button type="button" onClick={() => bulkSetStatus('PENDING')}>
            סמנו כממתין
          </button>
          <button type="button" onClick={() => bulkSetStatus('DECLINED')}>
            סמנו כלא מגיע
          </button>
          <button type="button" className="dash-bulk-bar__delete" onClick={bulkDelete}>
            מחקו נבחרים
          </button>
          <button type="button" className="dash-bulk-bar__clear" onClick={() => setSelectedIds(new Set())}>
            נקו בחירה
          </button>
        </div>
      )}

      {error && <p className="dash-guest-error">{error}</p>}

      {guests.length === 0 && (
        <p className="dash-page-sub">עדיין אין אורחים ברשימה. הוסיפו את הראשון למעלה.</p>
      )}

      {guests.length > 0 && !groupView && (
        <div className="dash-table-card">
          <table className="dash-guest-table">
            {tableHeader}
            <tbody>{visibleGuests.map(renderRow)}</tbody>
          </table>
        </div>
      )}

      {guests.length > 0 && groupView && groupedSections && (
        <>
          {groups.map((group) => {
            const groupGuests = groupedSections.byGroup.get(group.id) ?? []
            if (groupGuests.length === 0) return null
            return (
              <div key={group.id} className="dash-group-section">
                <div className="dash-group-section__header">
                  <input
                    type="text"
                    defaultValue={group.name}
                    onBlur={(e) => e.target.value !== group.name && handleRenameGroup(group.id, e.target.value)}
                  />
                  <span className="dash-page-sub">{groupGuests.length} אורחים</span>
                  <button type="button" onClick={() => handleDeleteGroup(group.id)}>
                    מחקו קבוצה
                  </button>
                </div>
                <div className="dash-table-card">
                  <table className="dash-guest-table">
                    {tableHeader}
                    <tbody>{groupGuests.map(renderRow)}</tbody>
                  </table>
                </div>
              </div>
            )
          })}
          {groupedSections.ungrouped.length > 0 && (
            <div className="dash-group-section">
              <div className="dash-group-section__header">
                <strong>ללא קבוצה</strong>
                <span className="dash-page-sub">{groupedSections.ungrouped.length} אורחים</span>
              </div>
              <div className="dash-table-card">
                <table className="dash-guest-table">
                  {tableHeader}
                  <tbody>{groupedSections.ungrouped.map(renderRow)}</tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showCsvModal && (
        <ImportModal
          weddingId={wedding.id}
          onClose={() => setShowCsvModal(false)}
          onImported={load}
        />
      )}

      {showInviteModal && (
        <InviteModal
          weddingId={wedding.id}
          recipientCount={guests.filter((g) => g.phone).length}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}
