import { describe, expect, it } from 'vitest'
import { buildWaLink } from './whatsapp'

describe('buildWaLink', () => {
  it('converts a local phone number to international form in the URL', () => {
    const link = buildWaLink('0501234567', 'hello')
    expect(link.startsWith('https://wa.me/972501234567?text=')).toBe(true)
  })

  it('URL-encodes the message text', () => {
    const link = buildWaLink('0501234567', 'שלום & ברכות!')
    const [, query] = link.split('?text=')
    expect(decodeURIComponent(query)).toBe('שלום & ברכות!')
  })
})
