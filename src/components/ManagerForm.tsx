'use client'

import { useFormState } from 'react-dom'
import { createManager } from '@/actions/managers'
import { SubmitButton } from './SubmitButton'

export function ManagerForm() {
  const [state, formAction] = useFormState(createManager, {})
  const err = state.fieldErrors?.name?.[0]

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Имя менеджера"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900"
        />
        <SubmitButton className="shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60">
          Добавить
        </SubmitButton>
      </div>
      {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
    </form>
  )
}
