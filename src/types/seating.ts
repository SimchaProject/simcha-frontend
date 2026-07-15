export interface SeatingTable {
  id: string
  weddingId: string
  label: string
  capacity: number
}

export interface SeatAssignment {
  id: string
  guestId: string
  guestName: string
  tableId: string | null
  originalTableId: string | null
  locked: boolean
}

export interface SeatingReport {
  initialScore: number
  finalScore: number
  iterations: number
  durationMs: number
}

export interface SeatingSnapshot {
  tables: SeatingTable[]
  assignments: SeatAssignment[]
}

export interface OptimizeResponse extends SeatingSnapshot {
  report: SeatingReport
}
