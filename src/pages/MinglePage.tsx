import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { mingleApi } from '../api/mingle'
import type { MingleList, MinglePerson } from '../types/rsvp'
import { VineDivider } from '../components/motifs/VineDivider'
import { resizeImage } from '../utils/resizeImage'
import './MinglePage.css'
import './InvitePage.css'

export function MinglePage() {
  const { weddingSlug, token } = useParams<{ weddingSlug: string; token: string }>()
  const [list, setList] = useState<MingleList | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)

  const [busy, setBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  // Bumped after an upload so the browser refetches an image whose URL didn't
  // change.
  const [photoVersion, setPhotoVersion] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    if (!weddingSlug || !token) return
    mingleApi
      .list(weddingSlug, token)
      .then((result) => {
        setList(result)
        setLoading(false)
      })
      .catch(() => {
        setDenied(true)
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingSlug, token])

  const handlePhotoPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !weddingSlug || !token) return
    setBusy(true)
    setPhotoError(null)
    try {
      const resized = await resizeImage(file)
      await mingleApi.uploadPhoto(weddingSlug, token, resized)
      setPhotoVersion((v) => v + 1)
      load()
    } catch {
      setPhotoError('לא הצלחנו להעלות את התמונה, נסו שוב')
    } finally {
      setBusy(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!weddingSlug || !token) return
    setBusy(true)
    setPhotoError(null)
    try {
      await mingleApi.removePhoto(weddingSlug, token)
      setPhotoVersion((v) => v + 1)
      load()
    } catch {
      setPhotoError('לא הצלחנו להסיר את התמונה')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="invite-page">
        <p className="invite-page__error">טוען...</p>
      </div>
    )
  }

  // Deliberately vague: the API answers 404 the same way for a wrong token, a
  // token from another wedding, someone who opted back out, and a couple who
  // turned the feature off - so the page can't say which happened either.
  if (denied || !list) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="invite-section-title">הקישור לא פעיל</p>
          <p className="invite-section-sub">
            פינת הרווקים פתוחה רק למי שסימנו בטופס אישור ההגעה שהם מגיעים לבד ופתוחים להכיר.
          </p>
          {weddingSlug && (
            <p className="invite-section-sub">
              <Link to={`/w/${weddingSlug}/singles`}>הצטרפתם והקישור אבד? היכנסו עם הטלפון</Link>
              {' · '}
              <Link to={`/w/${weddingSlug}`}>חזרה לדף האירוע</Link>
            </p>
          )}
        </div>
      </div>
    )
  }

  const you = list.people.find((person) => person.isYou) ?? null
  const others = list.people.filter((person) => !person.isYou)

  const avatar = (person: MinglePerson) =>
    person.hasPhoto && weddingSlug && token ? (
      <img
        className="mingle-card__photo"
        src={`${mingleApi.photoUrl(weddingSlug, token, person.id)}?v=${photoVersion}`}
        alt={person.firstName}
        loading="lazy"
      />
    ) : (
      <span className="mingle-card__photo mingle-card__photo--empty" aria-hidden="true">
        {person.firstName.slice(0, 1)}
      </span>
    )

  return (
    <div className="invite-page">
      <div className="invite-card">
        <p className="mingle-heart" aria-hidden="true">
          ♡
        </p>
        <p className="invite-eyebrow">רווקים ורווקות</p>
        <p className="invite-names">
          {list.coupleNameA} <span className="invite-amp">&amp;</span> {list.coupleNameB}
        </p>
        <p className="invite-section-sub">
          כל מי שסימנ/ה בטופס שהוא מגיע/ה לבד ופתוח/ה להכיר. אף אחד לא מופיע כאן בלי שבחר בזה
          בעצמו, ואין כאן מספרי טלפון — את השאר תעשו באירוע.
        </p>

        <VineDivider />

        {you && (
          <div className="mingle-you">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handlePhotoPicked}
            />
            {avatar(you)}
            <div className="mingle-you__text">
              <p className="mingle-you__title">
                {you.hasPhoto ? 'ככה אתם מופיעים כאן' : 'הוסיפו תמונה'}
              </p>
              <p className="mingle-you__sub">
                {you.hasPhoto
                  ? 'רק מי שנמצא בפינה הזאת רואה אותה.'
                  : 'לא חובה — אבל שם בלי פנים קשה לזהות בין מאתיים אורחים.'}
              </p>
              <div className="mingle-you__actions">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                >
                  {busy ? 'רגע...' : you.hasPhoto ? 'החלפת תמונה' : 'העלאת תמונה'}
                </button>
                {you.hasPhoto && (
                  <button type="button" onClick={handleRemovePhoto} disabled={busy}>
                    הסרה
                  </button>
                )}
              </div>
              {photoError && <p className="invite-field__error">{photoError}</p>}
            </div>
          </div>
        )}

        {others.length === 0 ? (
          <p className="invite-section-sub">
            כרגע אתם הראשונים כאן. שווה לחזור לקישור הזה קרוב יותר לאירוע.
          </p>
        ) : (
          <ul className="mingle-list">
            {others.map((person) => (
              <li key={person.id} className="mingle-card">
                {avatar(person)}
                <div className="mingle-card__body">
                  <div className="mingle-card__head">
                    <span className="mingle-card__name">{person.firstName}</span>
                    {person.age !== null && <span className="mingle-card__age">{person.age}</span>}
                  </div>
                  {person.bio && <p className="mingle-card__bio">{person.bio}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="invite-section-sub invite-section-sub--note mingle-footnote">
          {others.length > 0 && `${others.length} אנשים בפינה · `}
          רוצים לצאת מהרשימה? מלאו שוב את טופס אישור ההגעה בלי לסמן את התיבה, והפרופיל שלכם יימחק.
        </p>
      </div>
    </div>
  )
}
