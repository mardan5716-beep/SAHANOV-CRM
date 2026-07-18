import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { updateProduct } from '@/actions/products'
import { ProductForm } from '@/components/ProductForm'
import { moneyToInput } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findFirst({
    where: { id: params.id, deletedAt: null },
  })
  if (!product) notFound()

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/products/${product.id}`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          ← Назад
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Редактирование товара</h1>
      </div>

      <ProductForm
        action={updateProduct.bind(null, product.id)}
        defaults={{
          sku: product.sku,
          name: product.name,
          category: product.category,
          price: moneyToInput(product.price),
          cost: moneyToInput(product.cost),
          stock: String(product.stock),
          minStock: String(product.minStock),
          location: product.location,
        }}
        submitLabel="Сохранить"
      />
    </div>
  )
}
