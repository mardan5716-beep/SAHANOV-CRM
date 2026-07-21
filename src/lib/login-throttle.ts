export const MAX_ATTEMPTS = 5
export const LOCK_MINUTES = 15

/** Заблокирован ли вход (lockedUntil в будущем). */
export function isLocked(lockedUntil: Date | null, now: Date): boolean {
  return !!lockedUntil && lockedUntil.getTime() > now.getTime()
}

/**
 * Новое состояние счётчика после неудачной попытки:
 * до порога — инкремент; на пороге — блокировка на LOCK_MINUTES и сброс счётчика.
 */
export function registerFailure(
  currentCount: number,
  now: Date,
): { failedLoginCount: number; lockedUntil: Date | null } {
  const count = currentCount + 1
  if (count >= MAX_ATTEMPTS) {
    return {
      failedLoginCount: 0,
      lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000),
    }
  }
  return { failedLoginCount: count, lockedUntil: null }
}
