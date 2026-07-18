'use client'

import { useFormState } from 'react-dom'
import { login, type LoginState } from '@/actions/auth'
import { SubmitButton } from '@/components/SubmitButton'

const initialState: LoginState = {}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initialState)

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
            GS
          </div>
          <h1 className="text-2xl font-bold">Glint &amp; Steel</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Вход для менеджеров</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoFocus
              autoComplete="username"
              placeholder="you@glint.kz"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {state.error}
            </p>
          )}

          <SubmitButton pendingText="Вход…">Войти</SubmitButton>
        </form>
      </div>
    </main>
  )
}
