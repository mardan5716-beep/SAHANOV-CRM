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
  const [clients, managers, products] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.manager.findMany({
      where: { deletedAt: null, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    }),
  ])

  const productOptions = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    price: Number(p.price),
    cost: Number(p.cost),
    stock: p.stock,
  }))

  return (
    <div className="space-y-4">
      <div>
        <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          ← Сделки
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Новая сделка</h1>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Сначала добавьте товары на склад — из них собираются позиции сделки.
          </p>
          <Link
            href="/products/new"
            className="mt-3 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            + Новый товар
          </Link>
        </div>
      ) : (
        <OrderForm
          action={createOrder}
          clients={clients}
          managers={managers}
          products={productOptions}
          defaults={{ clientId: searchParams.clientId }}
          submitLabel="Создать сделку"
        />
      )}
    </div>
  )
}
