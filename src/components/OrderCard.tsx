import Link from 'next/link'
import type { Order, Client, OrderItem } from '@prisma/client'
import { OrderStatusBadge } from './OrderStatusBadge'
import { formatMoney, formatDate } from '@/lib/format'
import { orderTotal, orderBalance } from '@/lib/order-calc'

type OrderWithRels = Order & { client: Client; items: OrderItem[] }

export function OrderCard({ order }: { order: OrderWithRels }) {
  const total = orderTotal(order.items)
  const balance = orderBalance(total, order.paid)

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 active:scale-[0.99] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-gray-400">{order.number}</div>
          <h3 className="truncate font-semibold leading-tight">{order.client.name}</h3>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <div>
          <span className="font-medium">{formatMoney(total)}</span>
          {balance > 0 && (
            <span className="text-gray-500 dark:text-gray-400">
              {' '}· остаток {formatMoney(balance)}
            </span>
          )}
        </div>
        <span className="text-gray-500 dark:text-gray-400">
          {formatDate(order.createdAt)}
        </span>
      </div>
    </Link>
  )
}
