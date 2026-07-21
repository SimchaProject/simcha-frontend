interface SeedDotsProps {
  value: number
  max?: number
  onChange: (value: number) => void
  label?: string
}

export function SeedDots({ value, max = 6, onChange, label }: SeedDotsProps) {
  return (
    <div className="seed-row" role="group" aria-label={label}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={`seed${n <= value ? ' seed--filled' : ' seed--empty'}`}
          aria-pressed={n === value}
          aria-label={String(n)}
          onClick={() => onChange(n)}
        />
      ))}
    </div>
  )
}
