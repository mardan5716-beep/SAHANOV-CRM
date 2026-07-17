import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { updateOrder } from '@/actions/orders'
import { OrderForm } from '@/components/OrderForm'
import { moneyToInput, toDateInput } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function EditOrderPage({
  params,
}: {
  params: { id: string }
}) {
  const [order, clients] = await Promise.all([
    prisma.order.findFirst({ where: { id: params.id, deletedAt: null } }),
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])
  if (!order) notFound()

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/orders/${order.id}`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          ← Назад
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Редактирование заказа</h1>
      </div>

      <OrderForm
        action={updateOrder.bind(null, order.id)}
        clients={clients}
        defaults={{
          clientId: order.clientId,
          title: order.title,
          description: order.description,
          status: order.status,
          price: moneyToInput(order.price),
          prepaid: moneyToInput(order.prepaid),
          measureDate: toDateInput(order.measureDate),
          dueDate: toDateInput(order.dueDate),
          notes: order.notes,
        }}
        submitLabel="Сохранить"
      />
    </div>
  )
}
