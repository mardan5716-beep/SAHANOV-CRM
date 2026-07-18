import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { deleteClient } from '@/actions/clients'
import { OrderCard } from '@/components/OrderCard'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'

export const dynamic = 'force-dynamic'

export default async function ClientPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      orders: {
        where: { deletedAt: null },
        include: { client: true, items: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!client) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clients" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          ← Клиенты
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{client.name}</h1>
        {client.company && (
          <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{client.company}</div>
        )}
      </div>

      {client.phone && (
        <a
          href={`tel:${client.phone.replace(/\s/g, '')}`}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-base font-semibold text-white transition active:scale-[0.99]"
        >
          Позвонить {client.phone}
        </a>
      )}

      <dl className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <Row label="Телефон" value={client.phone} />
        <Row label="Компания" value={client.company} />
        <Row label="Источник" value={client.source} />
      </dl>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Сделки <span className="text-sm font-normal text-gray-400">({client.orders.length})</span>
          </h2>
          <Link
            href={`/orders/new?clientId=${client.id}`}
            className="shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            + Сделка
          </Link>
        </div>
        {client.orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-800">
            У клиента пока нет сделок
          </p>
        ) : (
          <div className="space-y-2">
            {client.orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href={`/clients/${client.id}/edit`}
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-base font-semibold transition hover:bg-gray-50 active:scale-[0.99] dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Редактировать
        </Link>
        <ConfirmDeleteButton
          action={deleteClient.bind(null, client.id)}
          label="Удалить"
          confirmText={
            client.orders.length > 0
              ? `Удалить клиента «${client.name}»? Вместе с ним скроются все его сделки (${client.orders.length}).`
              : `Удалить клиента «${client.name}»?`
          }
        />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5">{value || <span className="text-gray-400">—</span>}</dd>
    </div>
  )
}
