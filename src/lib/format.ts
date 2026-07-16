import type { Prisma } from '@prisma/client'

/** Значение денежной суммы: число, строка или Prisma.Decimal из БД. */
type Money = number | string | Prisma.Decimal

/** Приводит любое денежное значение к числу. */
function toNumber(value: Money): number {
  return Number(value)
}

/**
 * Форматирует сумму в рублях: 12500 → «12 500 ₽».
 * Копейки округляются до целых рублей. Разделители тысяч (Intl использует
 * узкий неразрывный пробел) приводятся к обычному пробелу.
 */
export function formatMoney(value: Money): string {
  const n = Math.round(toNumber(value))
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(n)
  const normalized = formatted.replace(/\s/g, ' ')
  return `${normalized} ₽`
}

/** Остаток к оплате = price − prepaid. Не хранится в БД, считается в коде. */
export function balance(price: Money, prepaid: Money): number {
  return toNumber(price) - toNumber(prepaid)
}

/**
 * Форматирует дату по-русски: «15 июля 2026» (без завершающего « г.»).
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
  return formatted.replace(/\s*г\.?$/, '').trim()
}

/** Преобразует дату в значение для <input type="date"> (YYYY-MM-DD, локальное). */
export function toDateInput(date: Date | null | undefined): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Преобразует денежное значение в строку для текстового поля (0 → пусто). */
export function moneyToInput(value: Money): string {
  const n = toNumber(value)
  return n === 0 ? '' : String(n)
}
