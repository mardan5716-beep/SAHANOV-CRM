import { describe, it, expect } from 'vitest'
import { formatOrderNumber, parseOrderNumber } from './order-number'

describe('formatOrderNumber', () => {
  it('форматирует с ведущими нулями', () => {
    expect(formatOrderNumber(1)).toBe('GS-00001')
    expect(formatOrderNumber(123)).toBe('GS-00123')
    expect(formatOrderNumber(99999)).toBe('GS-99999')
  })
})

describe('parseOrderNumber', () => {
  it('извлекает число', () => {
    expect(parseOrderNumber('GS-00042')).toBe(42)
  })
  it('мусор → 0', () => {
    expect(parseOrderNumber('мусор')).toBe(0)
    expect(parseOrderNumber('')).toBe(0)
  })
})
