import Link from 'next/link'
import type { Product } from '@prisma/client'
import { formatMoney } from '@/lib/format'
import { categoryLabel } from '@/lib/enums'

export function ProductCard({ product }: { product: Product }) {
  const low = product.stock <= product.minStock

  return (
    <Link
      href={`/products/${product.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 active:scale-[0.99] dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs text-gray-400">{product.sku}</div>
          <h3 className="truncate font-semibold leading-tight">{product.name}</h3>
          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {categoryLabel(product.category)}
            {product.location ? ` · ${product.location}` : ''}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-medium">{formatMoney(product.price)}</div>
          <div
            className={`mt-1 text-sm ${
              low
                ? 'font-semibold text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {product.stock} шт
          </div>
        </div>
      </div>
    </Link>
  )
}
