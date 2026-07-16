import Link from 'next/link'
import type { Order, Client } from '@prisma/client'
import { getToday, isOverdue } from '@/lib/reminders'
import { formatMoney, formatDate, balance } from '@/lib/format'
import { StatusBadge } from '@/components/StatusBadge'

export const dynamic = 'force-dynamic'

type OrderWithClient = Order & { client: Client }

export default async function TodayPage() {
  const { now, measures, dues, awaiting, inWorkCount, totalBalance } =
    await getToday()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Сегодня</h1>
        <p className="mt-0.5 text-sm capitalize text-gray-500 dark:text-gray-400">
          {formatDate(now)}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Counter label="Заказов в работе" value={String(inWorkCount)} />
        <Counter label="К оплате" value={formatMoney(totalBalance)} />
      </div>

      <Section title="Замеры" count={measures.length} empty="Нет запланированных замеров">
        {measures.map((o) => (
          <ReminderRow
            key={o.id}
            order={o}
            date={o.measureDate!}
            overdue={isOverdue(o.measureDate!, now)}
          />
        ))}
      </Section>

      <Section title="Сроки сдачи" count={dues.length} empty="Нет ближайших сроков">
        {dues.map((o) => (
          <ReminderRow
            key={o.id}
            order={o}
            date={o.dueDate!}
            overdue={isOverdue(o.dueDate!, now)}
          />
        ))}
      </Section>

      <Section title="Ждут оплаты" count={awaiting.length} empty="Нет задолженностей">
        {awaiting.map((o) => (
          <PaymentRow key={o.id} order={o} />
        ))}
      </Section>
    </div>
  )
}

function Counter({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  )
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string
  count: number
  empty: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-800">
          {empty}
        </p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  )
}

function ReminderRow({
  order,
  date,
  overdue,
}: {
  order: OrderWithClient
  date: Date
  overdue: boolean
}) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 active:scale-[0.99] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="min-w-0">
        <div className="truncate font-semibold">{order.title}</div>
        <div className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
          {order.client.name}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div
          className={`text-sm font-medium ${
            overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          {formatDate(date)}
        </div>
        {overdue && (
          <div className="text-xs font-medium text-red-500">просрочено</div>
        )}
      </div>
    </Link>
  )
}

function PaymentRow({ order }: { order: OrderWithClient }) {
  const rest = balance(order.price, order.prepaid)
  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 active:scale-[0.99] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="min-w-0">
        <div className="truncate font-semibold">{order.title}</div>
        <div className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
          {order.client.name}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-red-600 dark:text-red-400">
          {formatMoney(rest)}
        </div>
        <div className="mt-1">
          <StatusBadge status={order.status} />
        </div>
      </div>
    </Link>
  )
}
