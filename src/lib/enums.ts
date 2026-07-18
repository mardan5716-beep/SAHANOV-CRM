import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  DeliveryMethod,
  DiscountType,
  Category,
} from '@prisma/client'

// ─── Статус заказа ──────────────────────────────────────────────────────────

/** Линейная воронка (без терминальных RETURN/CANCELLED). */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.INVOICED,
  OrderStatus.PAID,
  OrderStatus.PICKING,
  OrderStatus.PACKED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
]

/** Терминальные статусы вне линейной воронки. */
export const ORDER_STATUS_TERMINAL: OrderStatus[] = [
  OrderStatus.RETURN,
  OrderStatus.CANCELLED,
]

/** Полный порядок для фильтров. */
export const ORDER_STATUS_ORDER: OrderStatus[] = [
  ...ORDER_STATUS_FLOW,
  ...ORDER_STATUS_TERMINAL,
]

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Новая заявка',
  INVOICED: 'Счёт выставлен',
  PAID: 'Оплачено',
  PICKING: 'Комплектуется',
  PACKED: 'Упаковано',
  SHIPPED: 'Отправлено',
  DELIVERED: 'Получено',
  COMPLETED: 'Завершено',
  RETURN: 'Возврат',
  CANCELLED: 'Отменено',
}

const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  NEW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
  INVOICED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  PICKING: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  PACKED: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
  SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  DELIVERED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  RETURN: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}

const ORDER_STATUS_STEP_ACTIVE: Record<OrderStatus, string> = {
  NEW: 'bg-gray-500 text-white',
  INVOICED: 'bg-blue-600 text-white',
  PAID: 'bg-green-600 text-white',
  PICKING: 'bg-orange-500 text-white',
  PACKED: 'bg-amber-500 text-white',
  SHIPPED: 'bg-purple-600 text-white',
  DELIVERED: 'bg-indigo-600 text-white',
  COMPLETED: 'bg-green-600 text-white',
  RETURN: 'bg-red-600 text-white',
  CANCELLED: 'bg-red-600 text-white',
}

export function orderStatusLabel(s: OrderStatus): string {
  return ORDER_STATUS_LABELS[s]
}
export function orderStatusBadgeClass(s: OrderStatus): string {
  return ORDER_STATUS_BADGE[s]
}
export function orderStatusStepActiveClass(s: OrderStatus): string {
  return ORDER_STATUS_STEP_ACTIVE[s]
}
/** Следующий статус в линейной воронке или null. */
export function nextOrderStatus(s: OrderStatus): OrderStatus | null {
  const i = ORDER_STATUS_FLOW.indexOf(s)
  if (i < 0 || i >= ORDER_STATUS_FLOW.length - 1) return null
  return ORDER_STATUS_FLOW[i + 1]
}

// ─── Статус оплаты ──────────────────────────────────────────────────────────

export const PAYMENT_STATUS_ORDER: PaymentStatus[] = [
  PaymentStatus.UNPAID,
  PaymentStatus.PARTIAL,
  PaymentStatus.PAID,
  PaymentStatus.REFUNDED,
]

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Не оплачено',
  PARTIAL: 'Частично',
  PAID: 'Оплачено',
  REFUNDED: 'Возврат',
}

const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  UNPAID: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  PARTIAL: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  REFUNDED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
}

export function paymentStatusLabel(s: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[s]
}
export function paymentStatusBadgeClass(s: PaymentStatus): string {
  return PAYMENT_STATUS_BADGE[s]
}

// ─── Способ оплаты ──────────────────────────────────────────────────────────

export const PAYMENT_METHOD_ORDER: PaymentMethod[] = [
  PaymentMethod.KASPI,
  PaymentMethod.CASH,
  PaymentMethod.CARD,
  PaymentMethod.TRANSFER,
  PaymentMethod.OTHER,
]

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  KASPI: 'Kaspi',
  CASH: 'Наличные',
  CARD: 'Карта',
  TRANSFER: 'Перевод',
  OTHER: 'Другое',
}

export function paymentMethodLabel(m: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[m]
}

// ─── Способ получения ───────────────────────────────────────────────────────

export const DELIVERY_METHOD_ORDER: DeliveryMethod[] = [
  DeliveryMethod.PICKUP,
  DeliveryMethod.DELIVERY,
]

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  PICKUP: 'Самовывоз',
  DELIVERY: 'Доставка',
}

export function deliveryMethodLabel(m: DeliveryMethod): string {
  return DELIVERY_METHOD_LABELS[m]
}

// ─── Категории товаров ──────────────────────────────────────────────────────

export const CATEGORY_ORDER: Category[] = [
  Category.SHELVES,
  Category.CONSOLES,
  Category.SIDE_TABLES,
  Category.PLANT_STANDS,
  Category.ETAGERES,
  Category.ORGANIZERS,
  Category.MIRRORS,
  Category.BATHROOM,
  Category.KITCHEN,
  Category.OTHER,
]

const CATEGORY_LABELS: Record<Category, string> = {
  SHELVES: 'Полки',
  CONSOLES: 'Консоли',
  SIDE_TABLES: 'Приставные столики',
  PLANT_STANDS: 'Подставки для растений',
  ETAGERES: 'Этажерки',
  ORGANIZERS: 'Органайзеры',
  MIRRORS: 'Зеркала',
  BATHROOM: 'Аксессуары для ванной',
  KITCHEN: 'Аксессуары для кухни',
  OTHER: 'Другое',
}

export function categoryLabel(c: Category): string {
  return CATEGORY_LABELS[c]
}

// ─── Тип скидки ─────────────────────────────────────────────────────────────

export function discountTypeLabel(t: DiscountType): string {
  return t === 'PERCENT' ? '%' : '₸'
}
