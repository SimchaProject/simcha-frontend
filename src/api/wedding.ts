import { http } from './http'
import type { CreateWeddingPayload, Wedding } from '../types/wedding'

export const weddingApi = {
  getMine: () => http.get<Wedding | null>('/weddings/mine'),
  create: (payload: CreateWeddingPayload) => http.post<Wedding>('/weddings', payload),
}
