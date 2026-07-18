'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseManager } from '@/lib/validation'
import { hashPassword } from '@/lib/password'
import { requireAdmin } from '@/lib/session'

export type ManagerFormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
}

function isUniqueEmailError(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === 'P2002' &&
    Array.isArray((e.meta as { target?: string[] })?.target) &&
    (e.meta as { target: string[] }).target.includes('email')
  )
}

export async function createManager(
  _prevState: ManagerFormState,
  formData: FormData,
): Promise<ManagerFormState> {
  await requireAdmin()
  const parsed = parseManager(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const { password, ...rest } = parsed.data
  try {
    await prisma.manager.create({
      data: { ...rest, passwordHash: await hashPassword(password) },
    })
  } catch (e) {
    if (isUniqueEmailError(e)) {
      return { fieldErrors: { email: ['Этот email уже используется'] } }
    }
    throw e
  }
  revalidatePath('/managers')
  return {}
}

export async function setManagerAdmin(id: string, isAdmin: boolean): Promise<void> {
  await requireAdmin()
  await prisma.manager.update({ where: { id }, data: { isAdmin } })
  revalidatePath('/managers')
}

export async function deleteManager(id: string): Promise<void> {
  const admin = await requireAdmin()
  if (admin.id === id) {
    // защита от удаления самого себя
    redirect('/managers')
  }
  await prisma.manager.update({ where: { id }, data: { deletedAt: new Date() } })
  revalidatePath('/managers')
  redirect('/managers')
}
