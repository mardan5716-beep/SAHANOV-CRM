'use client'

import { useFormState } from 'react-dom'
import { createManager } from '@/actions/managers'
import { SubmitButton } from './SubmitButton'

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900'

export function ManagerForm() {
  const [state, formAction] = useFormState(createManager, {})
  const err = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
      <h2 className="font-semibold">Добавить менеджера</h2>

      <div>
        <input name="name" placeholder="Имя" className={inputClass} />
        {err.name?.[0] && <Err>{err.name[0]}</Err>}
      </div>
      <div>
        <input name="email" type="email" placeholder="Email" autoComplete="off" className={inputClass} />
        {err.email?.[0] && <Err>{err.email[0]}</Err>}
      </div>
      <div>
        <input name="password" type="password" placeholder="Пароль (минимум 6 символов)" autoComplete="new-password" className={inputClass} />
        {err.password?.[0] && <Err>{err.password[0]}</Err>}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isAdmin" className="h-4 w-4 rounded" />
        Права администратора (управление складом и менеджерами)
      </label>

      <SubmitButton>Добавить</SubmitButton>
    </form>
  )
}

function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{children}</p>
}
