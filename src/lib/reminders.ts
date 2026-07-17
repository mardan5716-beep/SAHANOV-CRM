import type { Prisma, Status } from '@prisma/client'
import { Status as StatusEnum } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { balance } from '@/lib/format'

/** Минимальный набор полей заказа для расчёта напоминаний. */
type ReminderOrder = {
  status: Status
  measureDate: Date | null
  dueDate: Date | null
  price: Prisma.Decimal | number | string
  prepaid: Prisma.Decimal | number | string
}

const DUE_SOON_DAYS = 3

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

/** Дата раньше начала сегодняшнего дня. */
export function isOverdue(date: Date, now: Date): boolean {
  return date.getTime() < startOfDay(now).getTime()
}

/** Замер: дата замера сегодня или раньше, заказ не завершён. */
export function isMeasureReminder(order: ReminderOrder, now: Date): boolean {
  if (order.status === StatusEnum.DONE) return false
  if (!order.measureDate) return false
  return order.measureDate.getTime() <= endOfDay(now).getTime()
}

/** Срок сдачи: в ближайшие 3 дня (или просрочен), заказ не завершён. */
export function isDueReminder(order: ReminderOrder, now: Date): boolean {
  if (order.status === StatusEnum.DONE) return false
  if (!order.dueDate) return false
  const limit = endOfDay(addDays(now, DUE_SOON_DAYS)).getTime()
  return order.dueDate.getTime() <= limit
}

/** Ждёт оплаты: заказ завершён, остаток к оплате больше нуля. */
export function isAwaitingPayment(order: ReminderOrder): boolean {
  if (order.status !== StatusEnum.DONE) return false
  return balance(order.price, order.prepaid) > 0
}

/** Данные для главной страницы «Сегодня». */
export async function getToday() {
  const now = new Date()
  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    include: { client: true },
  })

  const measures = orders
    .filter((o) => isMeasureReminder(o, now))
    .sort((a, b) => (a.measureDate!.getTime() - b.measureDate!.getTime()))

  const dues = orders
    .filter((o) => isDueReminder(o, now))
    .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))

  const awaiting = orders.filter(isAwaitingPayment)

  const inWorkCount = orders.filter((o) => o.status !== StatusEnum.DONE).length

  const totalBalance = orders.reduce((sum, o) => {
    const rest = balance(o.price, o.prepaid)
    return rest > 0 ? sum + rest : sum
  }, 0)

  return { now, measures, dues, awaiting, inWorkCount, totalBalance }
}
