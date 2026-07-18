'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseProduct } from '@/lib/validation'
import { requireAdmin } from '@/lib/session'

export type ProductFormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
}

function isUniqueSkuError(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === 'P2002' &&
    Array.isArray((e.meta as { target?: string[] })?.target) &&
    (e.meta as { target: string[] }).target.includes('sku')
  )
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin()
  const parsed = parseProduct(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }
  let id: string
  try {
    const product = await prisma.product.create({ data: parsed.data })
    id = product.id
  } catch (e) {
    if (isUniqueSkuError(e)) {
      return { fieldErrors: { sku: ['Такой артикул уже есть'] } }
    }
    throw e
  }
  revalidatePath('/products')
  redirect(`/products/${id}`)
}

export async function updateProduct(
  id: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin()
  const parsed = parseProduct(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }
  try {
    await prisma.product.update({ where: { id }, data: parsed.data })
  } catch (e) {
    if (isUniqueSkuError(e)) {
      return { fieldErrors: { sku: ['Такой артикул уже есть'] } }
    }
    throw e
  }
  revalidatePath('/products')
  revalidatePath(`/products/${id}`)
  redirect(`/products/${id}`)
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin()
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  revalidatePath('/products')
  redirect('/products')
}
