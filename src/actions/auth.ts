'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createSession, destroySession } from '@/lib/auth'

const loginSchema = z.object({
  password: z.string().min(1, 'Введите пароль'),
})

export type LoginState = { error?: string }

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: 'Введите пароль' }
  }

  const expected = process.env.APP_PASSWORD
  if (!expected) {
    return { error: 'APP_PASSWORD не настроен на сервере' }
  }
  if (parsed.data.password !== expected) {
    return { error: 'Неверный пароль' }
  }

  await createSession()
  redirect('/')
}

export async function logout(): Promise<void> {
  await destroySession()
  redirect('/login')
}
