import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { deleteOrder } from '@/actions/orders'
import { OrderStatusStepper } from '@/components/OrderStatusStepper'
import { PaymentBadge } from '@/components/OrderStatusBadge'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { formatMoney, formatDate } from '@/lib/format'
import {
  lineTotal,
  orderTotal,
  orderCost,
  orderBalance,
  margin,
  marginPercent,
} from '@/lib/order-calc'
import { paymentMethodLabel, deliveryMethodLabel, discountTypeLabel } from '@/lib/enums'

export const dynamic = 'force-dynamic'

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { client: true, manager: true, items: true },
  })
  if (!order) notFound()

  const itemsTotal = orderTotal(order.items)
  const cost = orderCost(order.items)
  const delivery = Number(order.deliveryCost)
  const total = itemsTotal + delivery
  const balance = orderBalance(total, order.paid)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          ← Сделки
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-bold">{order.number}</h1>
          <PaymentBadge status={order.paymentStatus} />
        </div>
        <Link
          href={`/clients/${order.clientId}`}
          className="mt-1 inline-block text-sm font-medium text-blue-600 dark:text-blue-400"
        >
          {order.client.name}
        </Link>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          {formatDate(order.createdAt)}
          {order.manager ? ` · ${order.manager.name}` : ''}
        </span>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Статус</h2>
        <OrderStatusStepper orderId={order.id} status={order.status} />
      </section>

      {/* Позиции */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Позиции</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          {order.items.map((it, i) => (
            <div
              key={it.id}
              className={`flex items-center justify-between gap-3 p-3 text-sm ${
                i > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{it.name}</div>
                <div className="font-mono text-xs text-gray-400">{it.sku}</div>
              </div>
              <div className="shrink-0 text-right">
                <div>{formatMoney(lineTotal(it))}</div>
                <div className="text-xs text-gray-400">
                  {it.qty} × {formatMoney(it.unitPrice)}
                  {Number(it.discountValue) > 0
                    ? ` − ${Number(it.discountValue)}${discountTypeLabel(it.discountType)}`
                    : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Итоги */}
      <section className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
        <SumRow label="Товары" value={formatMoney(itemsTotal)} />
        <SumRow label="Доставка" value={delivery > 0 ? formatMoney(delivery) : 'бесплатно'} />
        <SumRow label="Сумма к оплате" value={formatMoney(total)} strong />
        <SumRow label="Оплачено" value={formatMoney(order.paid)} />
        <SumRow label="Остаток" value={formatMoney(balance)} highlight={balance > 0} />
        <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
        <SumRow label="Себестоимость" value={formatMoney(cost)} muted />
        <SumRow
          label="Маржа по товарам"
          value={`${formatMoney(margin(itemsTotal, cost))} · ${marginPercent(itemsTotal, cost)}%`}
        />
      </section>

      {/* Оплата и доставка */}
      <section className="grid grid-cols-2 gap-3 text-sm">
        <InfoCard label="Способ оплаты" value={order.paymentMethod ? paymentMethodLabel(order.paymentMethod) : '—'} />
        <InfoCard label="Получение" value={deliveryMethodLabel(order.deliveryMethod)} />
        {order.deliveryMethod === 'DELIVERY' && (
          <>
            <InfoCard label="Стоимость доставки" value={delivery > 0 ? formatMoney(delivery) : 'бесплатно'} />
            <InfoCard label="Адрес" value={order.deliveryAddress || '—'} />
            <InfoCard label="Трек-номер" value={order.trackNumber || '—'} />
          </>
        )}
      </section>

      {order.notes && (
        <section>
          <h2 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Заметки</h2>
          <p className="whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
            {order.notes}
          </p>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href={`/orders/${order.id}/edit`}
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-base font-semibold transition hover:bg-gray-50 active:scale-[0.99] dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Редактировать
        </Link>
        <ConfirmDeleteButton
          action={deleteOrder.bind(null, order.id)}
          label="Удалить"
          confirmText={`Удалить сделку ${order.number}? Действие можно отменить только через базу.`}
        />
      </div>
    </div>
  )
}

function SumRow({
  label,
  value,
  strong = false,
  highlight = false,
  muted = false,
}: {
  label: string
  value: string
  strong?: boolean
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`${strong ? 'text-base font-bold' : 'font-medium'} ${
          highlight ? 'text-red-600 dark:text-red-400' : ''
        } ${muted ? 'text-gray-500 dark:text-gray-400' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  )
}
