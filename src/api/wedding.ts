import { http } from './http'
import type {
  CreateWeddingPayload,
  GuestPageConfig,
  GuestPageConfigInput,
  PublicWedding,
  Wedding,
} from '../types/wedding'

export const weddingApi = {
  getMine: () => http.get<Wedding | null>('/weddings/mine'),
  create: (payload: CreateWeddingPayload) => http.post<Wedding>('/weddings', payload),
  getBySlug: (slug: string) => http.get<PublicWedding>(`/weddings/${slug}`),
  getGuestPageConfig: (weddingId: string) =>
    http.get<GuestPageConfig>(`/weddings/${weddingId}/guest-page-config`),
  updateGuestPageConfig: (weddingId: string, payload: Partial<GuestPageConfigInput>) =>
    http.patch<GuestPageConfig>(`/weddings/${weddingId}/guest-page-config`, payload),
}
