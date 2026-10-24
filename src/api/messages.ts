import { http } from './http'
import type { WeddingMessage, WeddingMessageKind } from '../types/messages'

export const messagesApi = {
  list: (weddingId: string) => http.get<WeddingMessage[]>(`/weddings/${weddingId}/messages`),
  updateText: (weddingId: string, kind: WeddingMessageKind, text: string | null) =>
    http.patch<WeddingMessage>(`/weddings/${weddingId}/messages/${kind}`, { text }),
  uploadPhoto: (weddingId: string, kind: WeddingMessageKind, file: Blob) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.postForm<void>(`/weddings/${weddingId}/messages/${kind}/photo`, formData)
  },
  removePhoto: (weddingId: string, kind: WeddingMessageKind) =>
    http.del<void>(`/weddings/${weddingId}/messages/${kind}/photo`),
}
