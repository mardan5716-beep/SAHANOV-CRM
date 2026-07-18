import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { Category } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CATEGORY_ORDER } from '@/lib/enums'
import { ProductCard } from '@/components/ProductCard'
import { SearchInput } from '@/components/SearchInput'
import { CategoryFilter } from '@/components/CategoryFilter'

export const dynamic = 'force-dynamic'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string }
}) {
  const q = searchParams.q?.trim()
  const categoryParam = searchParams.category
  const category =
    categoryParam && CATEGORY_ORDER.includes(categoryParam as Category)
      ? (categoryParam as Category)
      : undefined

  const where: Prisma.ProductWhereInput = { deletedAt: null }
  if (category) where.category = category
  if (q) {
    where.OR = [
      { sku: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
    ]
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Склад</h1>
        <Link
          href="/products/new"
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
        >
          + Товар
        </Link>
      </div>

      <SearchInput placeholder="Поиск по артикулу или названию" />
      <CategoryFilter />

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400 dark:border-gray-800">
          Товары не найдены
        </p>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
