import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  SAVE_THE_DATE_DESIGNS,
  renderSaveTheDate,
  shortDateOf,
  type SaveTheDateData,
} from '../../lib/saveTheDate'
import { formatHebrewDate } from '../../lib/hebrewDate'
import { apiUrl } from '../../api/http'
import './save-the-date.css'

interface SaveTheDateSectionProps {
  coupleNameA: string
  coupleNameB: string
  date: string
  venue: string
  slug: string
  heroPhotoUrl: string | null
}

// A save-the-date goes out months before the invitation and is its own
// design decision, so it has its own styles rather than inheriting the guest
// page's theme. What it does share is the data - names, date, venue, photo -
// so there's nothing here to fill in.
export function SaveTheDateSection({
  coupleNameA,
  coupleNameB,
  date,
  venue,
  slug,
  heroPhotoUrl,
}: SaveTheDateSectionProps) {
  const [designId, setDesignId] = useState(SAVE_THE_DATE_DESIGNS[0].id)
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Photo-based designs can't draw anything until the image has decoded, so
  // it's loaded once here rather than inside the draw call.
  useEffect(() => {
    if (!heroPhotoUrl) {
      setPhoto(null)
      return
    }
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => setPhoto(image)
    image.onerror = () => setPhoto(null)
    image.src = apiUrl(heroPhotoUrl) ?? ''
  }, [heroPhotoUrl])

  const designs = useMemo(
    () => SAVE_THE_DATE_DESIGNS.filter((design) => !design.needsPhoto || photo),
    [photo],
  )

  // Uploading a photo adds designs; removing one takes them away. Either way
  // the selection has to stay on a design that still exists.
  useEffect(() => {
    if (!designs.some((design) => design.id === designId)) {
      setDesignId(designs[0].id)
    }
  }, [designs, designId])

  const data: SaveTheDateData = useMemo(
    () => ({
      coupleNameA,
      coupleNameB,
      dateLabel: formatHebrewDate(date),
      shortDate: shortDateOf(date),
      venue,
      photo,
    }),
    [coupleNameA, coupleNameB, date, venue, photo],
  )

  const design = designs.find((d) => d.id === designId) ?? designs[0]

  useEffect(() => {
    if (canvasRef.current && design) {
      renderSaveTheDate(canvasRef.current, design, data)
    }
  }, [design, data])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `save-the-date-${slug}.png`
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const message = `שמרו את התאריך! ${coupleNameA} ו${coupleNameB} מתחתנים ב-${shortDateOf(date)}, ${venue}. הזמנה רשמית ואישור הגעה בהמשך.`

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="std">
      <div className="std__intro">
        <p className="std__title">Save the Date</p>
        <p className="std__sub">
          בחרו סגנון, הורידו כתמונה ושלחו בוואטסאפ. הפרטים נלקחים מהחתונה שלכם — אין מה למלא כאן.
        </p>
      </div>

      <div className="std__layout">
        <div className="std__styles">
          {designs.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`std__style${option.id === design?.id ? ' is-active' : ''}`}
              onClick={() => setDesignId(option.id)}
            >
              <StylePreview designId={option.id} data={data} />
              <span className="std__style-label">{option.label}</span>
            </button>
          ))}
          {!photo && (
            <p className="std__photo-hint">
              העלו תמונה למעלה כדי לקבל גם עיצובים עם תמונה.
            </p>
          )}
        </div>

        <div className="std__preview">
          {/* The element the download comes from: preview and file are the
              same render, so there's nothing to keep in sync. */}
          <canvas
            ref={canvasRef}
            className="std__canvas"
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            aria-label="תצוגה מקדימה של כרטיס שמרו את התאריך"
          />
          <div className="std__actions">
            <button type="button" className="dash-btn dash-btn--primary" onClick={handleDownload}>
              הורדת התמונה
            </button>
            <button type="button" className="dash-btn" onClick={handleCopyMessage}>
              {copied ? 'הועתק!' : 'העתקת הודעה'}
            </button>
          </div>
          <p className="std__message">{message}</p>
        </div>
      </div>
    </div>
  )
}

// Each swatch is the real design drawn small, so the picker can't show
// something the card doesn't.
function StylePreview({ designId, data }: { designId: string; data: SaveTheDateData }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const design = SAVE_THE_DATE_DESIGNS.find((d) => d.id === designId)
    if (ref.current && design) renderSaveTheDate(ref.current, design, data)
  }, [designId, data])
  return <canvas ref={ref} className="std__style-canvas" />
}
