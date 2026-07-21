import type { ButtonHTMLAttributes } from 'react'

interface WaxSealButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  rotation?: number
}

export function WaxSealButton({
  loading,
  rotation = -6,
  className,
  style,
  children,
  disabled,
  ...rest
}: WaxSealButtonProps) {
  return (
    <button
      className={`wax-seal${className ? ` ${className}` : ''}`}
      style={{ transform: `rotate(${rotation}deg)`, ...style }}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="wax-seal__spinner" aria-hidden="true" /> : children}
    </button>
  )
}
