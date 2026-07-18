'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { parsePasswordChange } from '@/lib/validation'
import { hashPassword, verifyPassword } from '@/lib/password'
import { requireManager } from '@/lib/session'

export type PasswordState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  success?: boolean
}

/** Смена собственного пароля: нужен текущий пароль. */
export async function changePassword(
  _prevState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const manager = await requireManager()
  const parsed = parsePasswordChange(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  if (
    !manager.passwordHash ||
    !(await verifyPassword(parsed.data.currentPassword, manager.passwordHash))
  ) {
    return { fieldErrors: { currentPassword: ['Неверный текущий пароль'] } }
  }

  await prisma.manager.update({
    where: { id: manager.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  })
  revalidatePath('/account')
  return { success: true }
}
