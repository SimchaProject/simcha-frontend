import { describe, expect, it } from 'vitest'
import { normalizePhone, isValidIsraeliMobile } from './phone'

describe('normalizePhone', () => {
  it('strips spaces and dashes', () => {
    expect(normalizePhone('050 123 4567')).toBe('0501234567')
    expect(normalizePhone('050-123-4567')).toBe('0501234567')
  })

  it('leaves an already-normalized number unchanged', () => {
    expect(normalizePhone('0501234567')).toBe('0501234567')
  })
})

describe('isValidIsraeliMobile', () => {
  it('accepts a valid 05x mobile number', () => {
    expect(isValidIsraeliMobile('0501234567')).toBe(true)
  })

  it('accepts a valid number with spaces/dashes', () => {
    expect(isValidIsraeliMobile('050-123-4567')).toBe(true)
  })

  it('rejects a landline or malformed number', () => {
    expect(isValidIsraeliMobile('021234567')).toBe(false)
    expect(isValidIsraeliMobile('12345')).toBe(false)
    expect(isValidIsraeliMobile('')).toBe(false)
  })
})
