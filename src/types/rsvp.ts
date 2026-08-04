export interface RsvpPayload {
  name: string
  phone: string
  partySize: number
}

export interface RsvpResponse {
  id: string
  whatsappUrl: string | null
}
