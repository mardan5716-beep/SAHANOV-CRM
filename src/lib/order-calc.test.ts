import { describe, it, expect } from 'vitest'
import {
  lineTotal,
  orderTotal,
  orderCost,
  orderBalance,
  margin,
  marginPercent,
} from './order-calc'

const item = (o: Partial<Parameters<typeof lineTotal>[0]> = {}) => ({
  qty: 1,
  unitPrice: 0,
  unitCost: 0,
  discountType: 'PERCENT' as const,
  discountValue: 0,
  ...o,
})

describe('lineTotal', () => {
  it('без скидки', () => {
    expect(lineTotal(item({ qty: 3, unitPrice: 1000 }))).toBe(3000)
  })
  it('скидка в процентах', () => {
    expect(
      lineTotal(item({ qty: 2, unitPrice: 1000, discountType: 'PERCENT', discountValue: 10 })),
    ).toBe(1800)
  })
  it('скидка в тенге', () => {
    expect(
      lineTotal(item({ qty: 2, unitPrice: 1000, discountType: 'AMOUNT', discountValue: 500 })),
    ).toBe(1500)
  })
  it('скидка не уводит сумму в минус', () => {
    expect(
      lineTotal(item({ qty: 1, unitPrice: 1000, discountType: 'AMOUNT', discountValue: 5000 })),
    ).toBe(0)
  })
  it('принимает строковые значения', () => {
    expect(lineTotal(item({ qty: 2, unitPrice: '1500' }))).toBe(3000)
  })
})

describe('итоги заказа', () => {
  const items = [
    item({ qty: 2, unitPrice: 1000, unitCost: 600 }),
    item({ qty: 1, unitPrice: 3000, unitCost: 2000 }),
  ]
  it('orderTotal', () => expect(orderTotal(items)).toBe(5000))
  it('orderCost', () => expect(orderCost(items)).toBe(3200))
  it('orderBalance', () => expect(orderBalance(5000, 2000)).toBe(3000))
  it('margin', () => expect(margin(5000, 3200)).toBe(1800))
  it('marginPercent', () => expect(marginPercent(5000, 3200)).toBe(36))
  it('marginPercent при нулевой сумме → 0', () => expect(marginPercent(0, 0)).toBe(0))
})
