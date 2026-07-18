import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentManager } from '@/lib/session'
import { deleteProduct } from '@/actions/products'
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton'
import { formatMoney } from '@/lib/format'
import { categoryLabel } from '@/lib/enums'
import { margin, marginPercent } from '@/lib/order-calc'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findFirst({
    where: { id: params.id, deletedAt: null },
  })
  if (!product) notFound()

  const manager = await getCurrentManager()
  const isAdmin = manager?.isAdmin ?? false
  const low = product.stock <= product.minStock
  const unitMargin = margin(product.price, product.cost)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          ← Склад
        </Link>
        <div className="mt-1 font-mono text-sm text-gray-400">{product.sku}</div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {categoryLabel(product.category)}
          {product.location ? ` · ${product.location}` : ''}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <Field label="Цена" value={formatMoney(product.price)} />
        <Field
          label="Остаток"
          value={`${product.stock} шт (мин. ${product.minStock})`}
          highlight={low}
        />
        {isAdmin && (
          <>
            <Field label="Себестоимость" value={formatMoney(product.cost)} />
            <Field
              label="Маржа с единицы"
              value={`${formatMoney(unitMargin)} · ${marginPercent(product.price, product.cost)}%`}
            />
          </>
        )}
      </section>

      {low && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
          Остаток на минимуме или ниже — пора пополнить склад.
        </p>
      )}

      {isAdmin && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href={`/products/${product.id}/edit`}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-base font-semibold transition hover:bg-gray-50 active:scale-[0.99] dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Редактировать
          </Link>
          <ConfirmDeleteButton
            action={deleteProduct.bind(null, product.id)}
            label="Удалить"
            confirmText={`Удалить товар «${product.name}»?`}
          />
        </div>
      )}
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
      <div className={`mt-1 font-semibold ${highlight ? 'text-red-600 dark:text-red-400' : ''}`}>
        {value}
      </div>
    </div>
  )
}
