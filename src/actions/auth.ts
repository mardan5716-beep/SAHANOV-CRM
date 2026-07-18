'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession, destroySession } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'

const loginSchema = z.object({
  email: z.string().min(1, 'Введите email'),
  password: z.string().min(1, 'Введите пароль'),
})

export type LoginState = { error?: string }

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: 'Введите email и пароль' }
  }

  const manager = await prisma.manager.findFirst({
    where: { email: parsed.data.email, deletedAt: null },
  })
  if (
    !manager ||
    !manager.passwordHash ||
    !(await verifyPassword(parsed.data.password, manager.passwordHash))
  ) {
    return { error: 'Неверный email или пароль' }
  }

  await createSession(manager.id)
  redirect('/')
}

export async function logout(): Promise<void> {
  await destroySession()
  redirect('/login')
}
