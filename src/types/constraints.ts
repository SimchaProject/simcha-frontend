export type ConstraintType = 'MUST_SIT_TOGETHER' | 'MUST_AVOID'

export interface ParsedConstraintParticipant {
  guestId: string
  name: string
}

export interface ParsedConstraint {
  type: ConstraintType
  participants: ParsedConstraintParticipant[]
}

export interface ParseConstraintsResponse {
  constraints: ParsedConstraint[]
}

export interface CreateConstraintPayload {
  type: ConstraintType
  participants: { guestId: string }[]
}
