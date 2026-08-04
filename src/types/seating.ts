export interface SeatingTable {
  id: string
  weddingId: string
  label: string
  capacity: number
  x: number
  y: number
}

export interface CreateTablePayload {
  label: string
  capacity: number
  x?: number
  y?: number
}

export interface UpdateTablePayload {
  label?: string
  capacity?: number
  x?: number
  y?: number
}

export interface SeatAssignment {
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
