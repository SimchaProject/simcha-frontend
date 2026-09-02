export type TableShape = 'round' | 'square' | 'rectangular'

export interface SeatingTable {
  id: string
  weddingId: string
  label: string
  capacity: number
  x: number
  y: number
  shape: TableShape
  width: number | null
  height: number | null
}

export interface CreateTablePayload {
  label: string
  capacity: number
  x?: number
  y?: number
  shape?: TableShape
  width?: number
  height?: number
}

export interface UpdateTablePayload {
  label?: string
  capacity?: number
  x?: number
  y?: number
  shape?: TableShape
  width?: number
  height?: number
}

export interface SeatAssignment {
  guestId: string
  guestName: string
  tableId: string | null
  originalTableId: string | null
  locked: boolean
  seatIndex: number | null
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
