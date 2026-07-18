import Link from 'next/link'
import { createProduct } from '@/actions/products'
import { ProductForm } from '@/components/ProductForm'
import { requireAdmin } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  await requireAdmin()
  return (
    <div className="space-y-4">
      <div>
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          ← Склад
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Новый товар</h1>
      </div>
      <ProductForm action={createProduct} submitLabel="Добавить товар" />
    </div>
  )
}
