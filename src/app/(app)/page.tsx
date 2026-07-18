import Link from 'next/link'
import { getDashboard } from '@/lib/dashboard'
import { formatMoney } from '@/lib/format'
import { OrderCard } from '@/components/OrderCard'
import { categoryLabel } from '@/lib/enums'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { activeCount, totalDue, monthRevenue, monthMargin, lowStock, recentOrders } =
    await getDashboard()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>

      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Активных сделок" value={String(activeCount)} href="/orders?active=1" />
        <Kpi label="К оплате" value={formatMoney(totalDue)} highlight={totalDue > 0} href="/orders?due=1" />
        <Kpi label="Выручка за месяц" value={formatMoney(monthRevenue)} href="/orders?period=month" />
        <Kpi label="Маржа за месяц" value={formatMoney(monthMargin)} href="/orders?period=month" />
      </div>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-lg font-semibold">Мало на складе</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {lowStock.length}
          </span>
        </div>
        {lowStock.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-800">
            Все остатки в норме
          </p>
        ) : (
          <div className="space-y-2">
            {lowStock.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 active:scale-[0.99] dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {categoryLabel(p.category)}
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                  {p.stock} шт
                  <div className="text-xs font-normal text-gray-400">мин. {p.minStock}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Последние сделки</h2>
          <Link href="/orders" className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Все →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-800">
            Сделок пока нет
          </p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Kpi({
  label,
  value,
  highlight = false,
  href,
}: {
  label: string
  value: string
  highlight?: boolean
  href?: string
}) {
  const inner = (
    <>
      <div className={`text-2xl font-bold ${highlight ? 'text-red-600 dark:text-red-400' : ''}`}>
        {value}
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        {label}
        {href && <span aria-hidden className="text-gray-300 dark:text-gray-600">›</span>}
      </div>
    </>
  )
  const base = 'block rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900'
  if (!href) return <div className={base}>{inner}</div>
  return (
    <Link
      href={href}
      className={`${base} transition hover:border-gray-300 active:scale-[0.99] dark:hover:border-gray-700`}
    >
      {inner}
    </Link>
  )
}
