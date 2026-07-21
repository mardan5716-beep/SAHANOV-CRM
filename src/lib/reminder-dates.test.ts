import { describe, it, expect } from 'vitest'
import { isReminderDue, isReminderOverdue, presetDate } from './reminder-dates'

const now = new Date('2026-07-21T12:00:00')

describe('isReminderDue (сегодня или раньше)', () => {
  it('сегодня → попадает', () => {
    expect(isReminderDue(new Date('2026-07-21T09:00:00'), now)).toBe(true)
  })
  it('вчера (просрочено) → попадает', () => {
    expect(isReminderDue(new Date('2026-07-20T09:00:00'), now)).toBe(true)
  })
  it('завтра → не попадает', () => {
    expect(isReminderDue(new Date('2026-07-22T09:00:00'), now)).toBe(false)
  })
})

describe('isReminderOverdue', () => {
  it('вчера → просрочено', () => {
    expect(isReminderOverdue(new Date('2026-07-20T09:00:00'), now)).toBe(true)
  })
  it('сегодня → не просрочено', () => {
    expect(isReminderOverdue(new Date('2026-07-21T09:00:00'), now)).toBe(false)
  })
})

describe('presetDate', () => {
  it('через 7 дней', () => {
    const d = presetDate(7, now)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6) // июль
    expect(d.getDate()).toBe(28)
  })
})
