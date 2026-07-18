import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentManager } from '@/lib/session'
import { updateOrder } from '@/actions/orders'
import { OrderForm } from '@/components/OrderForm'

export const dynamic = 'force-dynamic'

export default async function EditOrderPage({ params }: { params: { id: string } }) {
  const manager = await getCurrentManager()
  const [order, clients, products] = await Promise.all([
    prisma.order.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { items: true },
    }),
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
  ])
  if (!order) notFound()

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
        <Link
          href={`/orders/${order.id}`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          ← Назад
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Редактирование {order.number}</h1>
      </div>

      <OrderForm
        action={updateOrder.bind(null, order.id)}
        clients={clients}
        products={productOptions}
        defaults={{
          clientId: order.clientId,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          paid: Number(order.paid),
          deliveryMethod: order.deliveryMethod,
          deliveryAddress: order.deliveryAddress,
          deliveryCost: Number(order.deliveryCost),
          trackNumber: order.trackNumber,
          notes: order.notes,
          items: order.items.map((i) => ({
            productId: i.productId ?? '',
            sku: i.sku,
            name: i.name,
            unitPrice: Number(i.unitPrice),
            unitCost: Number(i.unitCost),
            qty: i.qty,
            discountType: i.discountType,
            discountValue: Number(i.discountValue),
          })),
        }}
        submitLabel="Сохранить"
        canSeeMargin={manager?.isAdmin ?? false}
      />
    </div>
  )
}
