'use client'

import { useFormState } from 'react-dom'
import { changePassword, type PasswordState } from '@/actions/account'
import { SubmitButton } from './SubmitButton'

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900'
const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export function PasswordChangeForm() {
  const [state, formAction] = useFormState(changePassword, {} as PasswordState)
  const err = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className={labelClass}>
          Текущий пароль
        </label>
        <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" className={inputClass} />
        {err.currentPassword?.[0] && <Err>{err.currentPassword[0]}</Err>}
      </div>
      <div>
        <label htmlFor="newPassword" className={labelClass}>
          Новый пароль
        </label>
        <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" className={inputClass} />
        {err.newPassword?.[0] && <Err>{err.newPassword[0]}</Err>}
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>
          Повторите новый пароль
        </label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className={inputClass} />
        {err.confirm?.[0] && <Err>{err.confirm[0]}</Err>}
      </div>

      {state.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          Пароль изменён.
        </p>
      )}

      <SubmitButton>Сменить пароль</SubmitButton>
    </form>
  )
}

function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{children}</p>
}
