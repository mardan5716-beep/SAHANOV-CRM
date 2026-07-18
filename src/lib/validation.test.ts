import { describe, it, expect } from 'vitest'
import {
  clientSchema,
  productSchema,
  managerSchema,
  orderSchema,
} from './validation'

describe('clientSchema', () => {
  it('пустое имя → ошибка', () => {
    expect(clientSchema.safeParse({ name: '   ' }).success).toBe(false)
  })
  it('компания и источник опциональны', () => {
    const r = clientSchema.safeParse({ name: 'Айгуль', phone: '', company: '', source: '' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.company).toBeNull()
      expect(r.data.source).toBeNull()
    }
  })
})

describe('productSchema', () => {
  const base = {
    sku: 'GS-SHELF-01',
    name: 'Полка настенная',
    category: 'SHELVES',
    price: '12 500',
    cost: '7000',
    stock: '10',
    minStock: '3',
    location: 'A1',
  }
  it('пустой артикул → ошибка', () => {
    expect(productSchema.safeParse({ ...base, sku: '' }).success).toBe(false)
  })
  it('цена из строки с пробелами → число', () => {
    const r = productSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.price).toBe(12500)
      expect(r.data.stock).toBe(10)
    }
  })
  it('отрицательный остаток → ошибка', () => {
    expect(productSchema.safeParse({ ...base, stock: '-1' }).success).toBe(false)
  })
})

describe('managerSchema', () => {
  it('пустое имя → ошибка', () => {
    expect(managerSchema.safeParse({ name: '' }).success).toBe(false)
  })
  it('валидное имя → ок', () => {
    expect(managerSchema.safeParse({ name: 'Данияр' }).success).toBe(true)
  })
})

describe('orderSchema', () => {
  const validItem = {
    sku: 'GS-SHELF-01',
    name: 'Полка',
    unitPrice: '12500',
    unitCost: '7000',
    qty: 2,
    discountType: 'PERCENT',
    discountValue: 0,
  }
  const base = {
    clientId: 'c1',
    managerId: '',
    status: 'NEW',
    paymentStatus: 'UNPAID',
    paymentMethod: '',
    paid: '',
    deliveryMethod: 'PICKUP',
    items: [validItem],
  }

  it('без позиций → ошибка', () => {
    expect(orderSchema.safeParse({ ...base, items: [] }).success).toBe(false)
  })
  it('с валидной позицией → успех', () => {
    const r = orderSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.items).toHaveLength(1)
      expect(r.data.items[0].qty).toBe(2)
      expect(r.data.paid).toBe(0)
      expect(r.data.managerId).toBeNull()
    }
  })
  it('количество меньше 1 → ошибка', () => {
    expect(
      orderSchema.safeParse({ ...base, items: [{ ...validItem, qty: 0 }] }).success,
    ).toBe(false)
  })
  it('clientId обязателен', () => {
    expect(orderSchema.safeParse({ ...base, clientId: '' }).success).toBe(false)
  })
})
