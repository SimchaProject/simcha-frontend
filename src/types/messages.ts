export type WeddingMessageKind = 'INVITE' | 'THANK_YOU' | 'PAYMENT' | 'LOCATION'

// One couple-authored WhatsApp message. text/photoUrl null means the
// backend sends its built-in default wording / no photo for this kind.
export interface WeddingMessage {
  kind: WeddingMessageKind
  text: string | null
  photoUrl: string | null
}

// Mirrors WEDDING_MESSAGE_TEXT_MAX_LENGTH on the backend.
export const WEDDING_MESSAGE_TEXT_MAX_LENGTH = 700
