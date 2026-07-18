'use client'

import { useFormState } from 'react-dom'
import { Category } from '@prisma/client'
import { CATEGORY_ORDER, categoryLabel } from '@/lib/enums'
import { SubmitButton } from './SubmitButton'
import type { ProductFormState } from '@/actions/products'

export type ProductDefaults = {
  sku?: string
  name?: string
  category?: Category
  price?: string
  cost?: string
  stock?: string
  minStock?: string
  location?: string | null
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900'
const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export function ProductForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>
  defaults?: ProductDefaults
  submitLabel: string
}) {
  const [state, formAction] = useFormState(action, {} as ProductFormState)
  const err = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="sku" className={labelClass}>
          Артикул
        </label>
        <input id="sku" name="sku" defaultValue={defaults.sku ?? ''} placeholder="GS-SHELF-01" className={inputClass} />
        {err.sku?.[0] && <Err>{err.sku[0]}</Err>}
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>
          Наименование
        </label>
        <input id="name" name="name" defaultValue={defaults.name ?? ''} className={inputClass} />
        {err.name?.[0] && <Err>{err.name[0]}</Err>}
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>
          Категория
        </label>
        <select id="category" name="category" defaultValue={defaults.category ?? Category.OTHER} className={inputClass}>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className={labelClass}>
            Цена, ₸
          </label>
          <input id="price" name="price" inputMode="numeric" defaultValue={defaults.price ?? ''} placeholder="0" className={inputClass} />
          {err.price?.[0] && <Err>{err.price[0]}</Err>}
        </div>
        <div>
          <label htmlFor="cost" className={labelClass}>
            Себестоимость, ₸
          </label>
          <input id="cost" name="cost" inputMode="numeric" defaultValue={defaults.cost ?? ''} placeholder="0" className={inputClass} />
          {err.cost?.[0] && <Err>{err.cost[0]}</Err>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="stock" className={labelClass}>
            Остаток, шт
          </label>
          <input id="stock" name="stock" inputMode="numeric" defaultValue={defaults.stock ?? ''} placeholder="0" className={inputClass} />
          {err.stock?.[0] && <Err>{err.stock[0]}</Err>}
        </div>
        <div>
          <label htmlFor="minStock" className={labelClass}>
            Минимальный остаток
          </label>
          <input id="minStock" name="minStock" inputMode="numeric" defaultValue={defaults.minStock ?? ''} placeholder="0" className={inputClass} />
          {err.minStock?.[0] && <Err>{err.minStock[0]}</Err>}
        </div>
      </div>

      <div>
        <label htmlFor="location" className={labelClass}>
          Место хранения
        </label>
        <input id="location" name="location" defaultValue={defaults.location ?? ''} placeholder="Стеллаж A1" className={inputClass} />
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  )
}

function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{children}</p>
}
