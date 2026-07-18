import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ORDER_STATUS_ORDER } from '@/lib/enums'
import { grandTotal, orderBalance } from '@/lib/order-calc'
import { OrderCard } from '@/components/OrderCard'
import { SearchInput } from '@/components/SearchInput'
import { OrderStatusFilter } from '@/components/OrderStatusFilter'

export const dynamic = 'force-dynamic'

const INACTIVE: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.RETURN,
]

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; active?: string; due?: string; period?: string }
}) {
  const q = searchParams.q?.trim()
  const statusParam = searchParams.status
  const status =
    statusParam && ORDER_STATUS_ORDER.includes(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined
  const active = searchParams.active === '1'
  const due = searchParams.due === '1'
  const monthOnly = searchParams.period === 'month'

  const where: Prisma.OrderWhereInput = { deletedAt: null }
  if (status) where.status = status
  else if (active) where.status = { notIn: INACTIVE }
  if (monthOnly) {
    const now = new Date()
    where.createdAt = { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
  }
  if (q) {
    where.OR = [
      { number: { contains: q, mode: 'insensitive' } },
      { client: { is: { name: { contains: q, mode: 'insensitive' } } } },
    ]
  }

  let orders = await prisma.order.findMany({
    where,
    include: { client: true, items: true },
    orderBy: { createdAt: 'desc' },
  })

  // Остаток вычисляется в коде, поэтому фильтр «с остатком» — после выборки.
  if (due) {
    orders = orders.filter((o) => {
      const balance = orderBalance(grandTotal(o.items, o.deliveryCost), o.paid)
      return balance > 0 && !INACTIVE.includes(o.status)
    })
  }

  const contextLabel = active
    ? 'Активные сделки'
    : due
      ? 'С остатком к оплате'
      : monthOnly
        ? 'За текущий месяц'
        : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Сделки</h1>
        <Link
          href="/orders/new"
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
        >
          + Новая
        </Link>
      </div>

      {contextLabel && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm dark:bg-blue-950">
          <span className="font-medium text-blue-700 dark:text-blue-300">{contextLabel}</span>
          <Link href="/orders" className="text-blue-600 hover:underline dark:text-blue-400">
            Сбросить
          </Link>
        </div>
      )}

      <SearchInput placeholder="Поиск по номеру или клиенту" />
      <OrderStatusFilter />

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400 dark:border-gray-800">
          Сделки не найдены
        </p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
