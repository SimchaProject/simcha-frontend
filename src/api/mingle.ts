import { http, BASE_URL } from './http'
import type { MingleList } from '../types/rsvp'

export const mingleApi = {
  // The token in the path is the whole credential - it's the one a guest got
  // back when they opted in on the RSVP form.
  list: (weddingSlug: string, token: string) =>
    http.get<MingleList>(`/weddings/${weddingSlug}/mingle/${token}`),

  // For a guest who joined but no longer has their link: hands back the same
  // token in exchange for the phone number they gave the couple.
  access: (weddingSlug: string, phone: string) =>
    http.post<{ token: string }>(`/weddings/${weddingSlug}/mingle/access`, { phone }),

  // No "whose photo" argument: the token is the guest, and it's their own
  // photo they're setting.
  uploadPhoto: (weddingSlug: string, token: string, file: Blob) => {
    const form = new FormData()
    form.append('file', file, 'photo.jpg')
    return http.postForm<void>(`/weddings/${weddingSlug}/mingle/${token}/photo`, form)
  },
  removePhoto: (weddingSlug: string, token: string) =>
    http.del<void>(`/weddings/${weddingSlug}/mingle/${token}/photo`),

  // Rendered straight into an <img src>, so it's a URL rather than a fetch.
  // The viewer's own token gates it, same as the list.
  photoUrl: (weddingSlug: string, token: string, guestId: string) =>
    `${BASE_URL}/weddings/${weddingSlug}/mingle/${token}/photo/${guestId}`,
}
