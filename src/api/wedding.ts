import { http } from './http'
import type {
  CreateWeddingPayload,
  GuestPageConfigUpdate,
  PublicWeddingInfo,
  Wedding,
} from '../types/wedding'

export const weddingApi = {
  getMine: () => http.get<Wedding | null>('/weddings/mine'),
  create: (payload: CreateWeddingPayload) => http.post<Wedding>('/weddings', payload),
  getBySlug: (slug: string) => http.get<PublicWeddingInfo>(`/weddings/${slug}/public`),
  updateGuestPageConfig: (weddingId: string, payload: GuestPageConfigUpdate) =>
    http.patch<Wedding>(`/weddings/${weddingId}/guest-page-config`, payload),
}
