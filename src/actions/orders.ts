'use server'

import { z } from 'zod'
import { OrderStatus, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseOrder, type OrderItemInput } from '@/lib/validation'
import { nextOrderNumber } from '@/lib/order-number'
import { requireManager } from '@/lib/session'

export type OrderFormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
}

function itemsCreateData(items: OrderItemInput[]) {
  return items.map((it) => ({
    productId: it.productId ?? undefined,
    sku: it.sku,
    name: it.name,
    unitPrice: it.unitPrice,
    unitCost: it.unitCost,
    qty: it.qty,
    discountType: it.discountType,
    discountValue: it.discountValue,
  }))
}

/**
 * Синхронизирует остатки склада со статусом заказа:
 * SHIPPED → списать (однократно), RETURN/CANCELLED → вернуть (если были списаны).
 */
async function syncStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return

  const deduct = status === OrderStatus.SHIPPED
  const restore = status === OrderStatus.RETURN || status === OrderStatus.CANCELLED

  if (deduct && !order.stockDeductedAt) {
    for (const it of order.items) {
      if (it.productId) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.qty } },
        })
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: { stockDeductedAt: new Date() },
    })
  } else if (restore && order.stockDeductedAt) {
    for (const it of order.items) {
      if (it.productId) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.qty } },
        })
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: { stockDeductedAt: null },
    })
  }
}

export async function createOrder(
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const manager = await requireManager()

  // Инлайн-создание клиента прямо из формы сделки.
  let clientId = String(formData.get('clientId') ?? '')
  const newName = String(formData.get('newClientName') ?? '').trim()
  if (!clientId && newName) {
    const newPhone = String(formData.get('newClientPhone') ?? '').trim()
    const created = await prisma.client.create({
      data: { name: newName, phone: newPhone || null },
    })
    clientId = created.id
    formData.set('clientId', clientId)
  }

  const parsed = parseOrder(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const d = parsed.data

  let id = ''
  await prisma.$transaction(async (tx) => {
    const number = await nextOrderNumber(tx)
    const order = await tx.order.create({
      data: {
        number,
        clientId: d.clientId,
        managerId: manager.id,
        status: d.status,
        paymentStatus: d.paymentStatus,
        paymentMethod: d.paymentMethod,
        paid: d.paid,
        deliveryMethod: d.deliveryMethod,
        deliveryAddress: d.deliveryAddress,
        deliveryCost: d.deliveryCost,
        trackNumber: d.trackNumber,
        notes: d.notes,
        items: { create: itemsCreateData(d.items) },
      },
    })
    id = order.id
    await syncStock(tx, id, d.status)
  })

  revalidatePath('/orders')
  revalidatePath('/products')
  revalidatePath('/')
  redirect(`/orders/${id}`)
}

export async function updateOrder(
  id: string,
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = parseOrder(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const d = parsed.data

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId: id } })
    await tx.order.update({
      where: { id },
      data: {
        clientId: d.clientId,
        status: d.status,
        paymentStatus: d.paymentStatus,
        paymentMethod: d.paymentMethod,
        paid: d.paid,
        deliveryMethod: d.deliveryMethod,
        deliveryAddress: d.deliveryAddress,
        deliveryCost: d.deliveryCost,
        trackNumber: d.trackNumber,
        notes: d.notes,
        items: { create: itemsCreateData(d.items) },
      },
    })
    await syncStock(tx, id, d.status)
  })

  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)
  revalidatePath('/products')
  revalidatePath('/')
  redirect(`/orders/${id}`)
}

export async function deleteOrder(id: string): Promise<void> {
  await prisma.order.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  revalidatePath('/orders')
  revalidatePath('/')
  redirect('/orders')
}

/** Смена статуса одним нажатием + автосинхронизация склада. */
export async function setStatus(id: string, status: OrderStatus): Promise<void> {
  const parsed = z.nativeEnum(OrderStatus).safeParse(status)
  if (!parsed.success) return

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: parsed.data } })
    await syncStock(tx, id, parsed.data)
  })

  revalidatePath(`/orders/${id}`)
  revalidatePath('/orders')
  revalidatePath('/products')
  revalidatePath('/')
}
