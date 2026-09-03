import type { ButtonHTMLAttributes } from 'react'
import type { CtaVariant } from '../../theme/guestPageThemes'

interface WaxSealButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  rotation?: number
  /** 'rect' is a plain button for the "White Minimal" guest-page theme - no seal rotation. */
  variant?: CtaVariant
}

export function WaxSealButton({
  loading,
  rotation = -6,
  variant = 'seal',
  className,
  style,
  children,
  disabled,
  ...rest
}: WaxSealButtonProps) {
  const variantClass = variant === 'rect' ? ' wax-seal--rect' : ''
  return (
    <button
      className={`wax-seal${variantClass}${className ? ` ${className}` : ''}`}
      style={variant === 'seal' ? { transform: `rotate(${rotation}deg)`, ...style } : style}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="wax-seal__spinner" aria-hidden="true" /> : children}
    </button>
  )
}
