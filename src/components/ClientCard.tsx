import Link from 'next/link'
import type { Client } from '@prisma/client'

type ClientWithCount = Client & { _count?: { orders: number } }

export function ClientCard({ client }: { client: ClientWithCount }) {
  const count = client._count?.orders

  return (
    <Link
      href={`/clients/${client.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 active:scale-[0.99] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="min-w-0">
        <h3 className="truncate font-semibold">{client.name}</h3>
        <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
          {client.company || client.phone || '—'}
        </p>
      </div>
      {typeof count === 'number' && (
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {count} {pluralOrders(count)}
        </span>
      )}
    </Link>
  )
}

function pluralOrders(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'сделка'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'сделки'
  return 'сделок'
}
