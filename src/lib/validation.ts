import { z } from 'zod'
import {
  Category,
  DiscountType,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  DeliveryMethod,
} from '@prisma/client'

/** Обязательная строка: trim, пустая → ошибка. */
function requiredString(message: string) {
  return z.preprocess(
    (v) => (v === null || v === undefined ? '' : String(v).trim()),
    z.string().min(1, message),
  )
}

/** Необязательная строка: trim, пустая → null. */
const optionalString = z.preprocess((v) => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === '' ? null : s
}, z.string().nullable())

/** Денежное поле: «12 500» / число → число ≥ 0; пустое → 0. */
const moneyField = z.preprocess(
  (v) => {
    if (v === null || v === undefined || v === '') return 0
    if (typeof v === 'number') return v
    const cleaned = String(v).replace(/[^\d.,-]/g, '').replace(',', '.')
    if (cleaned === '' || cleaned === '-') return NaN
    return Number(cleaned)
  },
  z
    .number({ invalid_type_error: 'Введите корректную сумму' })
    .finite('Введите корректную сумму')
    .min(0, 'Сумма не может быть отрицательной'),
)

/** Целое ≥ min. Пустое значение → 0, если min = 0, иначе ошибка. */
function intField(min: number, message: string) {
  return z.preprocess(
    (v) => {
      if (v === null || v === undefined || v === '') return min === 0 ? 0 : NaN
      const cleaned = String(v).replace(/[^\d-]/g, '')
      if (cleaned === '' || cleaned === '-') return NaN
      return parseInt(cleaned, 10)
    },
    z
      .number({ invalid_type_error: message })
      .int(message)
      .min(min, `Не меньше ${min}`),
  )
}

// ─── Клиент ─────────────────────────────────────────────────────────────────

export const clientSchema = z.object({
  name: requiredString('Введите имя клиента'),
  phone: optionalString,
  company: optionalString,
  source: optionalString,
})

// ─── Товар ──────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  sku: requiredString('Введите артикул'),
  name: requiredString('Введите наименование'),
  category: z.nativeEnum(Category).default(Category.OTHER),
  price: moneyField,
  cost: moneyField,
  stock: intField(0, 'Введите остаток (целое число)'),
  minStock: intField(0, 'Введите минимальный остаток (целое число)'),
  location: optionalString,
})

// ─── Менеджер ───────────────────────────────────────────────────────────────

export const managerSchema = z.object({
  name: requiredString('Введите имя менеджера'),
})

// ─── Позиция заказа ─────────────────────────────────────────────────────────

export const orderItemSchema = z.object({
  productId: optionalString,
  sku: requiredString('Артикул позиции'),
  name: requiredString('Наименование позиции'),
  unitPrice: moneyField,
  unitCost: moneyField,
  qty: intField(1, 'Количество не меньше 1'),
  discountType: z.nativeEnum(DiscountType).default(DiscountType.PERCENT),
  discountValue: moneyField,
})

// ─── Заказ (сделка) ─────────────────────────────────────────────────────────

const optionalEnum = <T extends Record<string, string>>(e: T) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.nativeEnum(e).nullable(),
  )

export const orderSchema = z.object({
  clientId: requiredString('Выберите клиента'),
  managerId: optionalString,
  status: z.nativeEnum(OrderStatus).default(OrderStatus.NEW),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  paymentMethod: optionalEnum(PaymentMethod),
  paid: moneyField,
  deliveryMethod: z.nativeEnum(DeliveryMethod).default(DeliveryMethod.PICKUP),
  deliveryAddress: optionalString,
  deliveryCost: moneyField,
  trackNumber: optionalString,
  notes: optionalString,
  items: z.array(orderItemSchema).min(1, 'Добавьте хотя бы одну позицию'),
})

export type ClientInput = z.infer<typeof clientSchema>
export type ProductInput = z.infer<typeof productSchema>
export type ManagerInput = z.infer<typeof managerSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>

// ─── Хелперы чтения из FormData ─────────────────────────────────────────────

export function parseClient(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    company: formData.get('company'),
    source: formData.get('source'),
  })
}

export function parseProduct(formData: FormData) {
  return productSchema.safeParse({
    sku: formData.get('sku'),
    name: formData.get('name'),
    category: formData.get('category') ?? undefined,
    price: formData.get('price'),
    cost: formData.get('cost'),
    stock: formData.get('stock'),
    minStock: formData.get('minStock'),
    location: formData.get('location'),
  })
}

export function parseManager(formData: FormData) {
  return managerSchema.safeParse({ name: formData.get('name') })
}

export function parseOrder(formData: FormData) {
  let items: unknown = []
  try {
    items = JSON.parse(String(formData.get('items') ?? '[]'))
  } catch {
    items = []
  }
  return orderSchema.safeParse({
    clientId: formData.get('clientId'),
    managerId: formData.get('managerId'),
    status: formData.get('status') ?? undefined,
    paymentStatus: formData.get('paymentStatus') ?? undefined,
    paymentMethod: formData.get('paymentMethod'),
    paid: formData.get('paid'),
    deliveryMethod: formData.get('deliveryMethod') ?? undefined,
    deliveryAddress: formData.get('deliveryAddress'),
    deliveryCost: formData.get('deliveryCost'),
    trackNumber: formData.get('trackNumber'),
    notes: formData.get('notes'),
    items,
  })
}
