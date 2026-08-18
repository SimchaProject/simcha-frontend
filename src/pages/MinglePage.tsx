import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { mingleApi } from '../api/mingle'
import type { MingleList } from '../types/rsvp'
import { VineDivider } from '../components/motifs/VineDivider'
import './MinglePage.css'
import './InvitePage.css'

export function MinglePage() {
  const { weddingSlug, token } = useParams<{ weddingSlug: string; token: string }>()
  const [list, setList] = useState<MingleList | null>(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (!weddingSlug || !token) return
    let cancelled = false
    mingleApi
      .list(weddingSlug, token)
      .then((result) => {
        if (!cancelled) {
          setList(result)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDenied(true)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [weddingSlug, token])

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

  const others = list.people.filter((person) => !person.isYou)

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

        {others.length === 0 ? (
          <p className="invite-section-sub">
            כרגע אתם הראשונים כאן. שווה לחזור לקישור הזה קרוב יותר לאירוע.
          </p>
        ) : (
          <ul className="mingle-list">
            {others.map((person) => (
              <li key={person.id} className="mingle-card">
                <div className="mingle-card__head">
                  <span className="mingle-card__name">{person.firstName}</span>
                  {person.age !== null && <span className="mingle-card__age">{person.age}</span>}
                </div>
                {person.bio && <p className="mingle-card__bio">{person.bio}</p>}
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
