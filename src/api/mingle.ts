import { http } from './http'
import type { MingleList } from '../types/rsvp'

export const mingleApi = {
  // The token in the path is the whole credential - it's the one a guest got
  // back when they opted in on the RSVP form.
  list: (weddingSlug: string, token: string) =>
    http.get<MingleList>(`/weddings/${weddingSlug}/mingle/${token}`),
}
