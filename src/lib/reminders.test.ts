import { describe, it, expect } from 'vitest'
import { Status } from '@prisma/client'
import {
  isOverdue,
  isMeasureReminder,
  isDueReminder,
  isAwaitingPayment,
} from './reminders'

const now = new Date('2026-07-16T12:00:00')

function order(overrides: Partial<Parameters<typeof isMeasureReminder>[0]> = {}) {
  return {
    status: Status.NEW,
    measureDate: null,
    dueDate: null,
    price: 0,
    prepaid: 0,
    ...overrides,
  }
}

describe('isOverdue', () => {
  it('вчерашняя дата — просрочена', () => {
    expect(isOverdue(new Date('2026-07-15T10:00:00'), now)).toBe(true)
  })
  it('сегодняшняя дата — не просрочена', () => {
    expect(isOverdue(new Date('2026-07-16T09:00:00'), now)).toBe(false)
  })
  it('будущая дата — не просрочена', () => {
    expect(isOverdue(new Date('2026-07-20T10:00:00'), now)).toBe(false)
  })
})

describe('isMeasureReminder', () => {
  it('замер сегодня — попадает', () => {
    expect(isMeasureReminder(order({ measureDate: new Date('2026-07-16T09:00:00') }), now)).toBe(true)
  })
  it('замер вчера (просрочен) — попадает', () => {
    expect(isMeasureReminder(order({ measureDate: new Date('2026-07-15T09:00:00') }), now)).toBe(true)
  })
  it('замер завтра — не попадает', () => {
    expect(isMeasureReminder(order({ measureDate: new Date('2026-07-17T09:00:00') }), now)).toBe(false)
  })
  it('завершённый заказ — не попадает', () => {
    expect(
      isMeasureReminder(order({ status: Status.DONE, measureDate: new Date('2026-07-16T09:00:00') }), now),
    ).toBe(false)
  })
  it('без даты замера — не попадает', () => {
    expect(isMeasureReminder(order(), now)).toBe(false)
  })
})

describe('isDueReminder', () => {
  it('срок через 2 дня — попадает', () => {
    expect(isDueReminder(order({ dueDate: new Date('2026-07-18T09:00:00') }), now)).toBe(true)
  })
  it('срок через 3 дня — попадает', () => {
    expect(isDueReminder(order({ dueDate: new Date('2026-07-19T09:00:00') }), now)).toBe(true)
  })
  it('срок через 5 дней — не попадает', () => {
    expect(isDueReminder(order({ dueDate: new Date('2026-07-21T09:00:00') }), now)).toBe(false)
  })
  it('просроченный срок — попадает', () => {
    expect(isDueReminder(order({ dueDate: new Date('2026-07-14T09:00:00') }), now)).toBe(true)
  })
  it('завершённый заказ — не попадает', () => {
    expect(
      isDueReminder(order({ status: Status.DONE, dueDate: new Date('2026-07-18T09:00:00') }), now),
    ).toBe(false)
  })
})

describe('isAwaitingPayment', () => {
  it('завершён с остатком — попадает', () => {
    expect(isAwaitingPayment(order({ status: Status.DONE, price: 10000, prepaid: 3000 }))).toBe(true)
  })
  it('завершён без остатка — не попадает', () => {
    expect(isAwaitingPayment(order({ status: Status.DONE, price: 10000, prepaid: 10000 }))).toBe(false)
  })
  it('в работе с остатком — не попадает (ещё не завершён)', () => {
    expect(isAwaitingPayment(order({ status: Status.PRODUCTION, price: 10000, prepaid: 0 }))).toBe(false)
  })
})
