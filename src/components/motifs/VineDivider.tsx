interface Leaf {
  x: number
  r: number
}

interface VineDividerProps {
  leaves?: Leaf[]
}

const DEFAULT_LEAVES: Leaf[] = [
  { x: 90, r: 6 },
  { x: 200, r: 7 },
  { x: 310, r: 6 },
]

export function VineDivider({ leaves = DEFAULT_LEAVES }: VineDividerProps) {
  return (
    <svg
      className="vine-divider"
      width="100%"
      height="26"
      viewBox="0 0 400 26"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="13" x2="400" y2="13" />
      {leaves.map((leaf) => (
        <g key={leaf.x} transform={`translate(${leaf.x},13)`}>
          <circle r={leaf.r} />
          <path d={`M -3 ${-leaf.r} L 0 ${-(2 * leaf.r - 1)} L 3 ${-leaf.r}`} />
        </g>
      ))}
    </svg>
  )
}
