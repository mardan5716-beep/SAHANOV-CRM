import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { deleteOrder } from '@/actions/orders'
import { StatusStepper } from '@/components/StatusStepper'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { formatMoney, formatDate, balance } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function OrderPage({
  params,
}: {
  params: { id: string }
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { client: true },
  })
  if (!order) notFound()

  const rest = balance(order.price, order.prepaid)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/orders"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          ← Заказы
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{order.title}</h1>
        <Link
          href={`/clients/${order.clientId}`}
          className="mt-1 inline-block text-sm font-medium text-blue-600 dark:text-blue-400"
        >
          {order.client.name}
        </Link>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          Статус
        </h2>
        <StatusStepper orderId={order.id} status={order.status} />
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Field label="Сумма" value={formatMoney(order.price)} />
        <Field label="Предоплата" value={formatMoney(order.prepaid)} />
        <Field
          label="Остаток"
          value={formatMoney(rest)}
          highlight={rest > 0}
        />
      </section>

      {(order.measureDate || order.dueDate) && (
        <section className="grid grid-cols-2 gap-3">
          {order.measureDate && (
            <Field label="Дата замера" value={formatDate(order.measureDate)} />
          )}
          {order.dueDate && (
            <Field label="Срок сдачи" value={formatDate(order.dueDate)} />
          )}
        </section>
      )}

      {order.description && (
        <TextBlock title="Описание" text={order.description} />
      )}
      {order.notes && <TextBlock title="Заметки" text={order.notes} />}

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
          confirmText={`Удалить заказ «${order.title}»? Действие необратимо.`}
        />
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div
        className={`mt-1 font-semibold ${
          highlight ? 'text-red-600 dark:text-red-400' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </h2>
      <p className="whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
        {text}
      </p>
    </section>
  )
}
