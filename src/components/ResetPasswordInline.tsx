'use client'

import { useFormState } from 'react-dom'
import { resetManagerPassword } from '@/actions/managers'

export function ResetPasswordInline({ managerId }: { managerId: string }) {
  const [state, formAction] = useFormState(
    resetManagerPassword.bind(null, managerId),
    {} as { fieldErrors?: Record<string, string[] | undefined>; success?: boolean },
  )
  const err = state.fieldErrors?.newPassword?.[0]

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <input
        name="newPassword"
        type="text"
        placeholder="Новый пароль"
        autoComplete="off"
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900"
      />
      <button
        type="submit"
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        Сбросить пароль
      </button>
      {state.success && <span className="text-sm text-green-600 dark:text-green-400">✓ изменён</span>}
      {err && <span className="text-sm text-red-600 dark:text-red-400">{err}</span>}
    </form>
  )
}
