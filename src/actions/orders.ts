'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Status } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parseOrder } from '@/lib/validation'

export type OrderFormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function createOrder(
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = parseOrder(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const order = await prisma.order.create({ data: parsed.data })
  revalidatePath('/orders')
  revalidatePath('/')
  redirect(`/orders/${order.id}`)
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

  await prisma.order.update({ where: { id }, data: parsed.data })
  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)
  revalidatePath('/')
  redirect(`/orders/${id}`)
}

export async function deleteOrder(id: string): Promise<void> {
  // Мягкое удаление: запись помечается скрытой, но остаётся в базе.
  await prisma.order.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  revalidatePath('/orders')
  revalidatePath('/')
  redirect('/orders')
}

/** Смена статуса одним нажатием (кнопки-шаги воронки). */
export async function setStatus(id: string, status: Status): Promise<void> {
  const parsed = z.nativeEnum(Status).safeParse(status)
  if (!parsed.success) return

  await prisma.order.update({ where: { id }, data: { status: parsed.data } })
  revalidatePath(`/orders/${id}`)
  revalidatePath('/orders')
  revalidatePath('/')
}
