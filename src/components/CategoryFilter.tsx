'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CATEGORY_ORDER, categoryLabel } from '@/lib/enums'

/** Фильтр товаров по категории (query-параметр `category`). */
export function CategoryFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('category')

  function select(category: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (category) params.set('category', category)
    else params.delete('category')
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
      {CATEGORY_ORDER.map((c) => (
        <button key={c} onClick={() => select(c)} className={chip(current === c)}>
          {categoryLabel(c)}
        </button>
      ))}
    </div>
  )
}
