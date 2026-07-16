import { describe, it, expect } from 'vitest'
import { clientSchema, orderSchema } from './validation'

describe('clientSchema', () => {
  it('пустое имя → ошибка', () => {
    expect(clientSchema.safeParse({ name: '   ' }).success).toBe(false)
  })

  it('валидное имя, пустые поля превращаются в null', () => {
    const r = clientSchema.safeParse({
      name: '  Иван  ',
      phone: '',
      address: '',
      notes: '',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.name).toBe('Иван')
      expect(r.data.phone).toBeNull()
      expect(r.data.address).toBeNull()
      expect(r.data.notes).toBeNull()
    }
  })
})

describe('orderSchema', () => {
  const base = {
    clientId: 'c1',
    title: 'Перила',
    status: 'NEW',
    price: '',
    prepaid: '',
    measureDate: '',
    dueDate: '',
    description: '',
    notes: '',
  }

  it('пустой title → ошибка', () => {
    expect(orderSchema.safeParse({ ...base, title: '' }).success).toBe(false)
  })

  it('clientId обязателен', () => {
    expect(orderSchema.safeParse({ ...base, clientId: '' }).success).toBe(false)
  })

  it('price из строки с пробелами парсится в число', () => {
    const r = orderSchema.safeParse({ ...base, price: '12 500' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.price).toBe(12500)
  })

  it('пустые price/prepaid → 0', () => {
    const r = orderSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.price).toBe(0)
      expect(r.data.prepaid).toBe(0)
    }
  })

  it('отрицательная цена → ошибка', () => {
    expect(orderSchema.safeParse({ ...base, price: '-5' }).success).toBe(false)
  })

  it('пустые даты → null', () => {
    const r = orderSchema.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.measureDate).toBeNull()
      expect(r.data.dueDate).toBeNull()
    }
  })

  it('валидная дата парсится в Date', () => {
    const r = orderSchema.safeParse({ ...base, measureDate: '2026-07-15' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.measureDate instanceof Date).toBe(true)
  })

  it('невалидная дата → ошибка', () => {
    expect(orderSchema.safeParse({ ...base, dueDate: 'не дата' }).success).toBe(false)
  })
})
