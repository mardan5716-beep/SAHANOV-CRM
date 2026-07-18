import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ORDER_STATUS_ORDER } from '@/lib/enums'
import { OrderCard } from '@/components/OrderCard'
import { SearchInput } from '@/components/SearchInput'
import { OrderStatusFilter } from '@/components/OrderStatusFilter'

export const dynamic = 'force-dynamic'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const q = searchParams.q?.trim()
  const statusParam = searchParams.status
  const status =
    statusParam && ORDER_STATUS_ORDER.includes(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined

  const where: Prisma.OrderWhereInput = { deletedAt: null }
  if (status) where.status = status
  if (q) {
    where.OR = [
      { number: { contains: q, mode: 'insensitive' } },
      { client: { is: { name: { contains: q, mode: 'insensitive' } } } },
    ]
  }

  const orders = await prisma.order.findMany({
    where,
    include: { client: true, items: true },
    orderBy: { createdAt: 'desc' },
  })

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
