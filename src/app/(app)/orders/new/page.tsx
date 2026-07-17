import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { createOrder } from '@/actions/orders'
import { OrderForm } from '@/components/OrderForm'

export const dynamic = 'force-dynamic'

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: { clientId?: string }
}) {
  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/orders"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          ← Заказы
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Новый заказ</h1>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Сначала добавьте хотя бы одного клиента.
          </p>
          <Link
            href="/clients/new"
            className="mt-3 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            + Новый клиент
          </Link>
        </div>
      ) : (
        <OrderForm
          action={createOrder}
          clients={clients}
          defaults={{ clientId: searchParams.clientId }}
          submitLabel="Создать заказ"
        />
      )}
    </div>
  )
}
