import { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  orderTotal,
  orderCost,
  orderBalance,
  margin,
  type CalcItem,
} from '@/lib/order-calc'

type ItemRow = {
  qty: number
  unitPrice: unknown
  unitCost: unknown
  discountType: 'PERCENT' | 'AMOUNT'
  discountValue: unknown
}

function toCalc(items: ItemRow[]): CalcItem[] {
  return items.map((i) => ({
    qty: i.qty,
    unitPrice: Number(i.unitPrice),
    unitCost: Number(i.unitCost),
    discountType: i.discountType,
    discountValue: Number(i.discountValue),
  }))
}

/** Статусы, при которых заказ считается завершённым/неактивным. */
const INACTIVE: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.RETURN,
]

export async function getDashboard() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    include: { items: true, client: true },
    orderBy: { createdAt: 'desc' },
  })

  let activeCount = 0
  let totalDue = 0
  let monthRevenue = 0
  let monthMargin = 0

  for (const o of orders) {
    const items = toCalc(o.items)
    const itemsTotal = orderTotal(items)
    const cost = orderCost(items)
    const total = itemsTotal + Number(o.deliveryCost)
    const balance = orderBalance(total, Number(o.paid))

    if (!INACTIVE.includes(o.status)) activeCount++

    if (o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURN && balance > 0) {
      totalDue += balance
    }

    if (o.createdAt >= monthStart && o.status !== OrderStatus.CANCELLED) {
      monthRevenue += total
      monthMargin += margin(itemsTotal, cost)
    }
  }

  const products = await prisma.product.findMany({ where: { deletedAt: null } })
  const lowStock = products
    .filter((p) => p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock)

  const recentOrders = orders.slice(0, 8)

  return { activeCount, totalDue, monthRevenue, monthMargin, lowStock, recentOrders }
}
