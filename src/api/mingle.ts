import { http } from './http'
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
}
