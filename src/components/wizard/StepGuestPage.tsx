import { useRef, type ChangeEvent } from 'react'
import type { WizardData } from './types'
import { ThemePicker } from '../ui/ThemePicker'
import { formatHebrewDate } from '../../lib/hebrewDate'

interface StepGuestPageProps {
  data: WizardData
  onChange: (patch: Partial<WizardData>) => void
  heroPhotoFile: File | null
  heroPhotoPreviewUrl: string | null
  onPhotoChange: (file: File | null) => void
}

export function StepGuestPage({
  data,
  onChange,
  heroPhotoFile,
  heroPhotoPreviewUrl,
  onPhotoChange,
}: StepGuestPageProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    onPhotoChange(e.target.files?.[0] ?? null)
  }

  const handleRemovePhoto = () => {
    onPhotoChange(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  return (
    <div className="wizard-step">
      <p className="wizard-step__title">עיצוב דף האורחים</p>
      <p className="wizard-step__sub">כך ייראה הדף שהאורחים שלכם יראו</p>

      <div className="wizard-field">
        <label>ערכת עיצוב</label>
        <ThemePicker
          themeId={data.theme}
          accentColor={data.accentColor}
          onThemeChange={(theme) => onChange({ theme })}
          onAccentChange={(accentColor) => onChange({ accentColor })}
          coupleNameA={data.coupleNameA}
          coupleNameB={data.coupleNameB}
          dateLabel={data.date ? formatHebrewDate(data.date) : ''}
          venue={data.venue}
          heroPhotoUrl={heroPhotoPreviewUrl}
        />
      </div>

      <div className="wizard-field">
        <label htmlFor="wizard-welcome">הודעת פתיחה לאורחים (לא חובה)</label>
        <textarea
          id="wizard-welcome"
          value={data.welcomeMessage}
          onChange={(e) => onChange({ welcomeMessage: e.target.value })}
          placeholder="אנחנו כל כך שמחים שתצטרפו אלינו..."
          rows={3}
        />
      </div>

      <div className="wizard-field">
        <label htmlFor="wizard-hero-photo">תמונה בראש הדף (לא חובה)</label>
        <input
          id="wizard-hero-photo"
          ref={photoInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="wizard-photo-input"
        />
        <div className="wizard-photo-row">
          {heroPhotoPreviewUrl && (
            <img src={heroPhotoPreviewUrl} alt="" className="wizard-photo-preview" />
          )}
          <button
            type="button"
            className="wizard-photo-btn"
            onClick={() => photoInputRef.current?.click()}
          >
            {heroPhotoFile ? 'החלפת תמונה' : 'בחירת תמונה'}
          </button>
          {heroPhotoFile && (
            <button type="button" className="wizard-back-link" onClick={handleRemovePhoto}>
              הסרה
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
