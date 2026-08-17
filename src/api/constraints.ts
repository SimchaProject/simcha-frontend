import { http } from './http'
import type { CreateConstraintPayload, ParseConstraintsResponse } from '../types/constraints'

export const constraintsApi = {
  parse: (weddingId: string, text: string) =>
    http.post<ParseConstraintsResponse>(`/weddings/${weddingId}/constraints/parse`, { text }),

  create: (weddingId: string, payload: CreateConstraintPayload) =>
    http.post(`/weddings/${weddingId}/constraints`, payload),
}
