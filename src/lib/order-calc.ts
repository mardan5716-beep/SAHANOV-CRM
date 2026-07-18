import type { Prisma } from '@prisma/client'

type Num = number | string | Prisma.Decimal

/** Позиция заказа для расчётов (принимает снимки из БД или ввод формы). */
export type CalcItem = {
  qty: Num
  unitPrice: Num
  unitCost?: Num
  discountType: 'PERCENT' | 'AMOUNT'
  discountValue: Num
}

function n(v: Num | undefined): number {
  return v === undefined ? 0 : Number(v)
}

/** Сумма позиции: qty × unitPrice за вычетом скидки, не меньше 0. */
export function lineTotal(item: CalcItem): number {
  const subtotal = n(item.qty) * n(item.unitPrice)
  const discount =
    item.discountType === 'PERCENT'
      ? (subtotal * n(item.discountValue)) / 100
      : n(item.discountValue)
  return Math.max(0, subtotal - discount)
}

/** Сумма позиций заказа. */
export function orderTotal(items: CalcItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0)
}

/** Итог к оплате = сумма позиций + стоимость доставки. */
export function grandTotal(items: CalcItem[], deliveryCost: Num = 0): number {
  return orderTotal(items) + n(deliveryCost)
}

/** Себестоимость заказа = сумма (unitCost × qty). */
export function orderCost(items: CalcItem[]): number {
  return items.reduce((sum, i) => sum + n(i.unitCost) * n(i.qty), 0)
}

/** Остаток к оплате = сумма заказа − оплачено. */
export function orderBalance(total: Num, paid: Num): number {
  return n(total) - n(paid)
}

/** Маржа = выручка − себестоимость. */
export function margin(total: Num, cost: Num): number {
  return n(total) - n(cost)
}

/** Маржинальность в процентах (0 при нулевой выручке), округляется до целого. */
export function marginPercent(total: Num, cost: Num): number {
  const t = n(total)
  if (t === 0) return 0
  return Math.round((margin(t, cost) / t) * 100)
}
