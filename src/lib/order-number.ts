import type { Prisma, PrismaClient } from '@prisma/client'

const PREFIX = 'GS-'
const PAD = 5

/** Форматирует номер заказа: 1 → «GS-00001». */
export function formatOrderNumber(n: number): string {
  return `${PREFIX}${String(n).padStart(PAD, '0')}`
}

/** Извлекает число из номера заказа: «GS-00042» → 42; иначе 0. */
export function parseOrderNumber(s: string): number {
  const m = /(\d+)\s*$/.exec(s ?? '')
  return m ? parseInt(m[1], 10) : 0
}

type Db = PrismaClient | Prisma.TransactionClient

/**
 * Следующий свободный номер заказа. Читает существующие номера, берёт максимум +1.
 * Вызывать внутри транзакции создания заказа.
 */
export async function nextOrderNumber(db: Db): Promise<string> {
  const orders = await db.order.findMany({ select: { number: true } })
  const max = orders.reduce((m, o) => Math.max(m, parseOrderNumber(o.number)), 0)
  return formatOrderNumber(max + 1)
}
