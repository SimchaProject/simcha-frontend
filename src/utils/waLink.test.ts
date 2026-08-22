import { describe, expect, it } from 'vitest'
import { buildInviteMessage, buildWaMeLink, toInternationalPhone } from './waLink'

describe('toInternationalPhone', () => {
  it('drops the leading zero and prefixes the country code', () => {
    expect(toInternationalPhone('0521234567')).toBe('972521234567')
  })

  it('handles a number typed with separators', () => {
    expect(toInternationalPhone('052-123-4567')).toBe('972521234567')
  })

  it('leaves an already-international number alone', () => {
    expect(toInternationalPhone('+972521234567')).toBe('972521234567')
  })
})

describe('buildWaMeLink', () => {
  it('encodes the message into the wa.me url', () => {
    const link = buildWaMeLink('0521234567', 'שלום עולם')
    expect(link.startsWith('https://wa.me/972521234567?text=')).toBe(true)
    expect(decodeURIComponent(link.split('text=')[1])).toBe('שלום עולם')
  })

  it('survives a message containing a url, & and newlines', () => {
    const message = buildInviteMessage('דנה', 'רותם', 'עידן', 'http://x.test/w/a-b?c=1&d=2')
    const link = buildWaMeLink('0521234567', message)
    expect(decodeURIComponent(link.split('text=')[1])).toBe(message)
  })
})
