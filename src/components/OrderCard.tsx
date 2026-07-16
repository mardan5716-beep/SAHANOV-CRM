import Link from 'next/link'
import type { Order, Client } from '@prisma/client'
import { StatusBadge } from './StatusBadge'
import { formatMoney, formatDate, balance } from '@/lib/format'

type OrderWithClient = Order & { client: Client }

export function OrderCard({
  order,
  showClient = true,
}: {
  order: OrderWithClient
  showClient?: boolean
}) {
  const rest = balance(order.price, order.prepaid)

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 active:scale-[0.99] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-tight">{order.title}</h3>
        <StatusBadge status={order.status} />
      </div>

      {showClient && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {order.client.name}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <div>
          <span className="font-medium">{formatMoney(order.price)}</span>
          {rest > 0 && (
            <span className="text-gray-500 dark:text-gray-400">
              {' '}· остаток {formatMoney(rest)}
            </span>
          )}
        </div>
        {order.dueDate && (
          <span className="text-gray-500 dark:text-gray-400">
            до {formatDate(order.dueDate)}
          </span>
        )}
      </div>
    </Link>
  )
}
