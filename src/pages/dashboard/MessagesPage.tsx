import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from './dashboard-context'
import { messagesApi } from '../../api/messages'
import { guestsApi } from '../../api/guests'
import { weddingApi } from '../../api/wedding'
import { apiUrl } from '../../api/http'
import { InviteModal, type InviteModalMode } from '../../components/guests/InviteModal'
import { resizeImage } from '../../utils/resizeImage'
import type { Guest } from '../../types/guests'
import type { GuestPageConfig, Wedding } from '../../types/wedding'
import {
  WEDDING_MESSAGE_TEXT_MAX_LENGTH,
  type WeddingMessage,
  type WeddingMessageKind,
} from '../../types/messages'
import './guests.css'
import './messages.css'

// Every custom message rides in the single free-text slot of the approved
// couple_message_he / couple_message_photo_he templates, so guests see this
// fixed greeting and sign-off around the couple's own text. Must match the
// wording actually approved in Meta, or the preview lies.
function templateBody(message: string): string {
  return `משפחה וחברים אהובים,\n${message}\nבאהבה 🤍`
}

function coupleNames(wedding: Wedding): string {
  return `${wedding.coupleNameA} ו${wedding.coupleNameB}`
}

// WhatsApp rejects line breaks inside a template slot, so the backend
// flattens them - previewed the same way so the couple isn't surprised.
function flatten(text: string): string {
  return text.replace(/\s*[\r\n\t]+\s*/g, ' ').trim()
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

function wazeSearchUrl(venue: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(venue)}&navigate=yes`
}

interface CardSpec {
  kind: WeddingMessageKind
  mode: InviteModalMode
  title: string
  audience: string
  // The backend's built-in wording when the couple leaves the text empty -
  // mirrors the defaults in guest-invite.service.ts.
  defaultText: (wedding: Wedding) => string
  // What the backend appends after the couple's text, or null if the
  // message can't be sent yet (with the reason).
  suffix: (wedding: Wedding, config: GuestPageConfig) => { text: string } | { blocked: string }
}

const CARDS: CardSpec[] = [
  {
    kind: 'INVITE',
    mode: 'invite',
    title: 'הזמנה לחתונה',
    audience: 'נשלחת לכל האורחים עם מספר טלפון. קישור לאישור הגעה מצורף אוטומטית.',
    defaultText: (w) =>
      `${coupleNames(w)} שמחים להזמין אתכם לחתונה שלנו ב-${formatDate(w.date)} ב${w.venue}!`,
    suffix: (w) => ({ text: `לאישור הגעה: ${window.location.origin}/w/${w.slug}` }),
  },
  {
    kind: 'THANK_YOU',
    mode: 'thank-you',
    title: 'הודעת תודה אחרי האירוע',
    audience: '',
    defaultText: (w) =>
      `תודה רבה שחגגתם איתנו! היה מרגש ומשמח לראות אתכם, ואנחנו מודים על כל מילה טובה ומתנה. ${coupleNames(w)}`,
    suffix: () => ({ text: '' }),
  },
  {
    kind: 'PAYMENT',
    mode: 'payment',
    title: 'מתנה - פייבוקס / ביט',
    audience: 'הקישורים לפייבוקס ולביט מצורפים אוטומטית.',
    defaultText: (w) => `למי שרוצה להעניק מתנה ל${coupleNames(w)}, אפשר בקלות דרך הקישורים:`,
    suffix: (_w, config) => {
      const links = [
        config.payboxLink && `פייבוקס: ${config.payboxLink}`,
        config.bitLink && `ביט: ${config.bitLink}`,
      ].filter(Boolean)
      return links.length
        ? { text: links.join(' | ') }
        : { blocked: 'כדי לשלוח את ההודעה הזו, הוסיפו קישור לפייבוקס או לביט בהגדרות.' }
    },
  },
  {
    kind: 'LOCATION',
    mode: 'location',
    title: 'מיקום האירוע - Waze',
    audience: 'קישור הניווט מצורף אוטומטית.',
    defaultText: (w) => `מחכים לראותכם בחתונה של ${coupleNames(w)} ב${w.venue}!`,
    suffix: (w, config) => ({ text: `ניווט ב-Waze: ${config.mapUrl || wazeSearchUrl(w.venue)}` }),
  },
]

// Who a non-invite message goes to. Confirmed guests by default; 'all'
// covers e.g. sending the location before the RSVPs are in.
type Audience = 'attending' | 'all'

const AUDIENCE_LABELS: Record<Audience, string> = {
  attending: 'מי שאישרו הגעה',
  all: 'כל האורחים',
}

export function MessagesPage() {
  const { wedding } = useDashboard()
  const [messages, setMessages] = useState<WeddingMessage[] | null>(null)
  const [config, setConfig] = useState<GuestPageConfig | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sending, setSending] = useState<{ mode: InviteModalMode; guestIds?: string[] } | null>(null)
  const [audiences, setAudiences] = useState<Partial<Record<WeddingMessageKind, Audience>>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all([
      messagesApi.list(wedding.id),
      weddingApi.getGuestPageConfig(wedding.id),
      guestsApi.list(wedding.id),
    ])
      .then(([freshMessages, freshConfig, freshGuests]) => {
        if (cancelled) return
        setMessages(freshMessages)
        setConfig(freshConfig)
        setGuests(freshGuests)
      })
      .catch(() => {
        if (!cancelled) setLoadError('לא הצלחנו לטעון את ההודעות.')
      })
    return () => {
      cancelled = true
    }
  }, [wedding.id])

  const withPhone = guests.filter((g) => g.phone)
  const audienceOf = (spec: CardSpec): Audience | null =>
    spec.kind === 'INVITE' ? null : (audiences[spec.kind] ?? 'attending')
  const recipientsOf = (spec: CardSpec) =>
    audienceOf(spec) === 'attending' ? withPhone.filter((g) => g.rsvpStatus === 'ATTENDING') : withPhone

  return (
    <div className="dash-messages">
      <div className="dash-page-header">
        <p className="dash-page-title">הודעות וואטסאפ</p>
        <p className="dash-page-sub">
          כתבו את ההודעות בניסוח שלכם והוסיפו תמונה. כל הודעה נפתחת ב&ldquo;משפחה וחברים
          אהובים,&rdquo; ומסתיימת ב&ldquo;באהבה 🤍&rdquo; - וכל מה שביניהן הוא הטקסט שלכם. ההודעות
          נשלחות ממספר הוואטסאפ של האפליקציה, אז כדאי לחתום בשמותיכם.
        </p>
      </div>

      {loadError && <p className="dash-guest-error">{loadError}</p>}
      {!loadError && (!messages || !config) && <p className="dash-page-sub">טוען...</p>}

      {messages && config && (
        <div className="msg-cards">
          {CARDS.map((spec) => (
            <MessageCard
              key={spec.kind}
              spec={spec}
              wedding={wedding}
              config={config}
              message={messages.find((m) => m.kind === spec.kind)!}
              recipientCount={recipientsOf(spec).length}
              audience={audienceOf(spec)}
              onAudienceChange={(audience) => setAudiences((prev) => ({ ...prev, [spec.kind]: audience }))}
              onSaved={(fresh) => setMessages((prev) => prev!.map((m) => (m.kind === fresh.kind ? fresh : m)))}
              onSend={() =>
                setSending({
                  mode: spec.mode,
                  // The server's default for these is confirmed guests; any
                  // other audience is sent as an explicit list, which it
                  // sends to exactly as given, whatever their status.
                  guestIds: audienceOf(spec) === 'all' ? withPhone.map((g) => g.id) : undefined,
                })
              }
            />
          ))}
        </div>
      )}

      {sending && (
        <InviteModal
          weddingId={wedding.id}
          mode={sending.mode}
          guestIds={sending.guestIds}
          recipientCount={recipientsOf(CARDS.find((c) => c.mode === sending.mode)!).length}
          onClose={() => setSending(null)}
        />
      )}
    </div>
  )
}

interface MessageCardProps {
  spec: CardSpec
  wedding: Wedding
  config: GuestPageConfig
  message: WeddingMessage
  recipientCount: number
  // null for the invite, which always goes to every guest with a phone.
  audience: Audience | null
  onAudienceChange: (audience: Audience) => void
  onSaved: (message: WeddingMessage) => void
  onSend: () => void
}

function MessageCard({
  spec,
  wedding,
  config,
  message,
  recipientCount,
  audience,
  onAudienceChange,
  onSaved,
  onSend,
}: MessageCardProps) {
  const [draft, setDraft] = useState(message.text ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  // The photo URL never changes when the photo is replaced - bumped to
  // bust the browser's cached copy of the old one.
  const [photoVersion, setPhotoVersion] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const dirty = draft.trim() !== (message.text ?? '')
  const suffix = spec.suffix(wedding, config)
  // The invite is the one message with a fixed-wording fallback: with no
  // custom text or photo, the original approved invite template goes out.
  const usesStockInvite = spec.kind === 'INVITE' && !draft.trim() && !message.photoUrl
  const body = flatten(draft) || spec.defaultText(wedding)
  const previewText = templateBody('text' in suffix && suffix.text ? `${body} ${suffix.text}` : body)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      onSaved(await messagesApi.updateText(wedding.id, spec.kind, draft.trim() || null))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  // Like the hero photo in settings, a picked photo uploads immediately -
  // separate from the text's save button.
  const handlePhotoPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    setError(null)
    try {
      // resizeImage outputs JPEG, one of the two formats WhatsApp accepts.
      const resized = await resizeImage(file, 1280)
      await messagesApi.uploadPhoto(wedding.id, spec.kind, resized)
      onSaved({ ...message, photoUrl: `/weddings/${wedding.id}/messages/${spec.kind}/photo` })
      setPhotoVersion((v) => v + 1)
    } catch {
      setError('לא הצלחנו להעלות את התמונה.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const handleRemovePhoto = async () => {
    setPhotoBusy(true)
    setError(null)
    try {
      await messagesApi.removePhoto(wedding.id, spec.kind)
      onSaved({ ...message, photoUrl: null })
    } catch {
      setError('לא הצלחנו להסיר את התמונה.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const photoSrc = message.photoUrl ? `${apiUrl(message.photoUrl)}?v=${photoVersion}` : undefined
  const sendBlocked = 'blocked' in suffix ? suffix.blocked : null
  // Said out loud rather than leaving a greyed-out button to explain itself.
  const noRecipients =
    recipientCount > 0
      ? null
      : audience === 'attending'
        ? 'אף אורח עם מספר טלפון עוד לא אישר הגעה. בחרו "כל האורחים", או סמנו אורחים כמגיעים ברשימת האורחים.'
        : 'אין עדיין אורחים עם מספר טלפון ברשימת האורחים.'

  return (
    <section className="msg-card">
      <div className="msg-card__editor">
        <h2 className="msg-card__title">{spec.title}</h2>
        {audience && (
          <div className="msg-card__audience-picker" role="radiogroup" aria-label="למי לשלוח">
            <span>נשלחת אל:</span>
            {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name={`msg-audience-${spec.kind}`}
                  checked={audience === option}
                  onChange={() => onAudienceChange(option)}
                />
                {AUDIENCE_LABELS[option]}
              </label>
            ))}
          </div>
        )}
        {spec.audience && <p className="msg-card__audience">{spec.audience}</p>}

        <label className="msg-card__label" htmlFor={`msg-text-${spec.kind}`}>
          הטקסט שלכם
        </label>
        <textarea
          id={`msg-text-${spec.kind}`}
          className="msg-card__textarea"
          rows={4}
          maxLength={WEDDING_MESSAGE_TEXT_MAX_LENGTH}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={spec.defaultText(wedding)}
        />
        <p className="msg-card__note">
          {draft.length}/{WEDDING_MESSAGE_TEXT_MAX_LENGTH} · השאירו ריק לשימוש בנוסח ברירת המחדל. ירידות
          שורה יהפכו לרווחים - וואטסאפ לא מאפשר אותן בהודעה מסוג זה.
        </p>

        <div className="msg-card__photo-row">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoPicked}
          />
          <button
            type="button"
            className="dash-guest-btn"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoBusy}
          >
            {photoBusy ? 'מעלה...' : message.photoUrl ? 'החלפת תמונה' : 'הוספת תמונה'}
          </button>
          {message.photoUrl && (
            <button type="button" className="dash-guest-btn" onClick={handleRemovePhoto} disabled={photoBusy}>
              הסרת תמונה
            </button>
          )}
        </div>

        {error && <p className="dash-guest-error">{error}</p>}
        {noRecipients && !sendBlocked && <p className="msg-card__blocked">{noRecipients}</p>}
        {sendBlocked && (
          <p className="msg-card__blocked">
            {sendBlocked} <Link to="/dashboard/settings">להגדרות</Link>
          </p>
        )}

        <div className="msg-card__actions">
          <button type="button" className="dash-btn" onClick={handleSave} disabled={saving || !dirty}>
            {saved ? 'נשמר!' : saving ? 'שומר...' : 'שמירת טקסט'}
          </button>
          <button
            type="button"
            className="dash-btn dash-btn--primary"
            onClick={onSend}
            disabled={dirty || !!sendBlocked || recipientCount === 0}
            title={dirty ? 'שמרו את הטקסט לפני השליחה' : (sendBlocked ?? noRecipients ?? undefined)}
          >
            שליחה ל-{recipientCount} אורחים
          </button>
        </div>
      </div>

      <div className="msg-card__preview" aria-label="תצוגה מקדימה">
        <p className="msg-card__preview-label">כך זה ייראה בוואטסאפ</p>
        <div className="msg-bubble">
          {photoSrc && <img src={photoSrc} alt="" className="msg-bubble__photo" />}
          {usesStockInvite ? (
            <p className="msg-bubble__text msg-bubble__text--muted">
              ללא טקסט או תמונה משלכם, תישלח ההזמנה הסטנדרטית עם קישור לאישור הגעה.
            </p>
          ) : (
            <p className="msg-bubble__text">{previewText}</p>
          )}
        </div>
      </div>
    </section>
  )
}
