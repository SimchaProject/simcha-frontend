import { InviteCardPreview } from '../motifs/InviteCardPreview'
import { GUEST_PAGE_THEMES, type GuestPageThemeId } from '../../theme/guestPageThemes'
import './ThemePicker.css'

interface ThemePickerProps {
  themeId: GuestPageThemeId
  accentColor: string | null
  onThemeChange: (id: GuestPageThemeId) => void
  onAccentChange: (color: string | null) => void
  coupleNameA: string
  coupleNameB: string
  dateLabel: string
  venue: string
  heroPhotoUrl?: string | null
}

/** Lets a couple pick one of the guest-page themes and nudge its accent color - used by both the creation wizard and Settings, so the two never drift out of sync. */
export function ThemePicker({
  themeId,
  accentColor,
  onThemeChange,
  onAccentChange,
  coupleNameA,
  coupleNameB,
  dateLabel,
  venue,
  heroPhotoUrl,
}: ThemePickerProps) {
  return (
    <div className="theme-picker">
      {GUEST_PAGE_THEMES.map((theme) => {
        const isSelected = theme.id === themeId
        const activeAccent = isSelected && accentColor ? accentColor : theme.accent

        return (
          <div
            key={theme.id}
            className={`theme-picker__card${isSelected ? ' theme-picker__card--selected' : ''}`}
          >
            <button
              type="button"
              className="theme-picker__preview-btn"
              onClick={() => onThemeChange(theme.id)}
              aria-pressed={isSelected}
            >
              <div className="theme-picker__preview-window">
                <div className="theme-picker__preview-scale">
                  <InviteCardPreview
                    themeId={theme.id}
                    accentColor={isSelected ? accentColor : null}
                    coupleNameA={coupleNameA || 'מאיה'}
                    coupleNameB={coupleNameB || 'יונתן'}
                    dateLabel={dateLabel || 'יום שישי, 12 ביוני 2026'}
                    venue={venue || 'גני יערה, בנימינה'}
                    heroPhotoUrl={heroPhotoUrl}
                  />
                </div>
              </div>
            </button>

            <div className="theme-picker__meta">
              <span className="theme-picker__name">{theme.label}</span>
              <span className="theme-picker__vibe">{theme.vibe}</span>
            </div>

            <div className="theme-picker__swatches">
              {theme.accentSwatches.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={`theme-picker__swatch${activeAccent === hex && isSelected ? ' theme-picker__swatch--active' : ''}`}
                  style={{ background: hex }}
                  aria-label={`${theme.label} – גוון ${hex}`}
                  aria-pressed={activeAccent === hex && isSelected}
                  onClick={() => {
                    if (!isSelected) onThemeChange(theme.id)
                    onAccentChange(hex === theme.accent ? null : hex)
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
