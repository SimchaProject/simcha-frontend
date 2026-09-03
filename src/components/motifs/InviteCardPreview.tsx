import type { ReactNode } from 'react'
import { getGuestPageTheme, guestPageThemeVars, type GuestPageThemeId } from '../../theme/guestPageThemes'
import { apiUrl } from '../../api/http'
// This component only ever renders .invite-* classes defined in InvitePage.css -
// import it here too (Vite dedupes identical CSS imports) so those styles
// exist wherever this component is used, not just on the real invite page.
import '../../pages/InvitePage.css'

interface InviteCardPreviewProps {
  themeId: GuestPageThemeId
  accentColor?: string | null
  coupleNameA: string
  coupleNameB: string
  /** Already formatted for display (see lib/hebrewDate's formatHebrewDate) - this component doesn't format dates itself. */
  dateLabel: string
  venue: string
  ceremonyTime?: string | null
  welcomeMessage?: string | null
  dressCode?: string | null
  heroPhotoUrl?: string | null
  /** Extra content rendered below the header - the real InvitePage's RSVP form, schedule, etc. Omitted entirely in a picker/settings preview. */
  children?: ReactNode
  className?: string
}

/** The guest-page header, themed. Used by the real InvitePage and by every design-picker preview, so what a couple sees while choosing is exactly what their guests get. */
export function InviteCardPreview({
  themeId,
  accentColor,
  coupleNameA,
  coupleNameB,
  dateLabel,
  venue,
  ceremonyTime,
  welcomeMessage,
  dressCode,
  heroPhotoUrl,
  children,
  className,
}: InviteCardPreviewProps) {
  const theme = getGuestPageTheme(themeId)

  return (
    <div
      className={`invite-card invite-card--${theme.edge}${className ? ` ${className}` : ''}`}
      style={guestPageThemeVars(theme, accentColor)}
    >
      {heroPhotoUrl && (
        <div className="invite-photo-wrap">
          <img src={apiUrl(heroPhotoUrl)} alt="" className="invite-photo" />
        </div>
      )}
      <p className="invite-eyebrow">בשמחה ובאהבה</p>
      <p className="invite-names">
        {coupleNameA} <span className="invite-amp">&amp;</span> {coupleNameB}
      </p>
      <p className="invite-subline">
        {dateLabel} &nbsp;·&nbsp; {venue}
        {ceremonyTime && (
          <>
            {' '}
            &nbsp;·&nbsp; שעה {ceremonyTime}
          </>
        )}
      </p>
      {welcomeMessage && <p className="invite-welcome-message">{welcomeMessage}</p>}
      {dressCode && <p className="invite-subline">קוד לבוש: {dressCode}</p>}
      {children}
    </div>
  )
}
