import { describe, it, expect } from 'vitest'
import { formatMoney, formatDate, balance } from './format'

describe('formatMoney', () => {
  it('форматирует рубли с разделителями тысяч', () => {
    expect(formatMoney(12500)).toBe('12 500 ₽')
  })
  it('принимает строку (Decimal из БД)', () => {
    expect(formatMoney('0')).toBe('0 ₽')
  })
  it('округляет копейки до целых рублей', () => {
    expect(formatMoney('99999.49')).toBe('99 999 ₽')
  })
  it('форматирует большие суммы', () => {
    expect(formatMoney(1234567)).toBe('1 234 567 ₽')
  })
})

describe('balance', () => {
  it('считает остаток price - prepaid', () => {
    expect(balance(10000, 3000)).toBe(7000)
  })
  it('работает со строками', () => {
    expect(balance('15000', '15000')).toBe(0)
  })
})

describe('formatDate', () => {
  it('форматирует дату по-русски без " г."', () => {
    expect(formatDate('2026-07-15T00:00:00')).toBe('15 июля 2026')
  })
  it('форматирует объект Date', () => {
    expect(formatDate(new Date('2026-01-05T12:00:00'))).toBe('5 января 2026')
  })
})
