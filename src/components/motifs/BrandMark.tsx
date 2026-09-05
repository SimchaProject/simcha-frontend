import { Logo } from './Logo'

interface BrandMarkProps {
  /** Wordmark font-size in px - the icon scales to match. Defaults to the
   * size used in a standalone nav bar. */
  size?: number
  className?: string
}

/** The "שמחה" wordmark paired with its crest - the one lockup used
 * everywhere the app names itself (landing nav, auth pages, the dashboard
 * sidebar, the wizard). Never used on a guest-facing page - there, the
 * couple's own names are the brand. */
export function BrandMark({ size = 32, className }: BrandMarkProps) {
  return (
    <span className={`brand-mark${className ? ` ${className}` : ''}`} style={{ fontSize: size }}>
      <Logo size={Math.round(size * 0.9)} className="brand-mark__icon" />
      <span className="brand-mark__text">שמחה</span>
    </span>
  )
}
