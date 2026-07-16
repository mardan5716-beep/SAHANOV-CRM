import { z } from 'zod'
import { Status } from '@prisma/client'

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

/** Денежное поле: строка «12 500» / число → число ≥ 0; пустое → 0. */
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

/** Дата: пустая → null; корректная строка → Date; иначе ошибка. */
const dateField = z.preprocess(
  (v) => {
    if (v === null || v === undefined || v === '') return null
    if (v instanceof Date) return v
    return new Date(String(v))
  },
  z.date({ invalid_type_error: 'Некорректная дата' }).nullable(),
)

export const clientSchema = z.object({
  name: requiredString('Введите имя клиента'),
  phone: optionalString,
  address: optionalString,
  notes: optionalString,
})

export const orderSchema = z.object({
  clientId: requiredString('Выберите клиента'),
  title: requiredString('Введите название заказа'),
  description: optionalString,
  status: z.nativeEnum(Status).default(Status.NEW),
  price: moneyField,
  prepaid: moneyField,
  measureDate: dateField,
  dueDate: dateField,
  notes: optionalString,
})

export type ClientInput = z.infer<typeof clientSchema>
export type OrderInput = z.infer<typeof orderSchema>

/** Читает и валидирует данные клиента из FormData. */
export function parseClient(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    notes: formData.get('notes'),
  })
}

/** Читает и валидирует данные заказа из FormData. */
export function parseOrder(formData: FormData) {
  return orderSchema.safeParse({
    clientId: formData.get('clientId'),
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status') ?? undefined,
    price: formData.get('price'),
    prepaid: formData.get('prepaid'),
    measureDate: formData.get('measureDate'),
    dueDate: formData.get('dueDate'),
    notes: formData.get('notes'),
  })
}
