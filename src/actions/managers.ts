'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseManager } from '@/lib/validation'

export type ManagerFormState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function createManager(
  _prevState: ManagerFormState,
  formData: FormData,
): Promise<ManagerFormState> {
  const parsed = parseManager(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }
  await prisma.manager.create({ data: parsed.data })
  revalidatePath('/managers')
  return {}
}

export async function deleteManager(id: string): Promise<void> {
  await prisma.manager.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  revalidatePath('/managers')
  redirect('/managers')
}
