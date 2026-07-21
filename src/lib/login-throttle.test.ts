import { describe, it, expect } from 'vitest'
import { isLocked, registerFailure, MAX_ATTEMPTS, LOCK_MINUTES } from './login-throttle'

const now = new Date('2026-07-21T12:00:00')

describe('isLocked', () => {
  it('null → не заблокирован', () => {
    expect(isLocked(null, now)).toBe(false)
  })
  it('будущее время → заблокирован', () => {
    expect(isLocked(new Date('2026-07-21T12:10:00'), now)).toBe(true)
  })
  it('прошедшее время → не заблокирован', () => {
    expect(isLocked(new Date('2026-07-21T11:50:00'), now)).toBe(false)
  })
})

describe('registerFailure', () => {
  it('до порога — увеличивает счётчик, без блокировки', () => {
    const r = registerFailure(0, now)
    expect(r.failedLoginCount).toBe(1)
    expect(r.lockedUntil).toBeNull()
  })
  it('на пороге — блокирует и сбрасывает счётчик', () => {
    const r = registerFailure(MAX_ATTEMPTS - 1, now)
    expect(r.failedLoginCount).toBe(0)
    expect(r.lockedUntil).not.toBeNull()
    expect(r.lockedUntil!.getTime()).toBe(now.getTime() + LOCK_MINUTES * 60_000)
  })
})
