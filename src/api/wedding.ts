import { http } from './http'
import type {
  CreateWeddingPayload,
  GuestPageConfig,
  GuestPageConfigUpdate,
  PublicWeddingInfo,
  Wedding,
} from '../types/wedding'

export const weddingApi = {
  getMine: () => http.get<Wedding | null>('/weddings/mine'),
  create: (payload: CreateWeddingPayload) => http.post<Wedding>('/weddings', payload),
  getBySlug: (slug: string) => http.get<PublicWeddingInfo>(`/weddings/${slug}`),
  getGuestPageConfig: (weddingId: string) =>
    http.get<GuestPageConfig>(`/weddings/${weddingId}/guest-page-config`),
  updateGuestPageConfig: (weddingId: string, payload: GuestPageConfigUpdate) =>
    http.patch<GuestPageConfig>(`/weddings/${weddingId}/guest-page-config`, payload),
  uploadHeroPhoto: (weddingId: string, file: Blob) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.postForm<void>(`/weddings/${weddingId}/guest-page-config/hero-photo`, formData)
  },
  removeHeroPhoto: (weddingId: string) =>
    http.del<void>(`/weddings/${weddingId}/guest-page-config/hero-photo`),
}
