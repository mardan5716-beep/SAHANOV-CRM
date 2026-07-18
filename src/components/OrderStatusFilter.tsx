'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ORDER_STATUS_ORDER, orderStatusLabel } from '@/lib/enums'

/** Фильтр сделок по статусу (query-параметр `status`). */
export function OrderStatusFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('status')

  function select(status: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (status) params.set('status', status)
    else params.delete('status')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
    }`

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <button onClick={() => select(null)} className={chip(!current)}>
        Все
      </button>
      {ORDER_STATUS_ORDER.map((s) => (
        <button key={s} onClick={() => select(s)} className={chip(current === s)}>
          {orderStatusLabel(s)}
        </button>
      ))}
    </div>
  )
}
