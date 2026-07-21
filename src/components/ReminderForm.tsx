'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { createReminder } from '@/actions/reminders'
import { presetDate } from '@/lib/reminder-dates'
import { toDateInput } from '@/lib/format'
import { SubmitButton } from './SubmitButton'

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900'

export function ReminderForm({ clientId }: { clientId: string }) {
  const [state, formAction] = useFormState(createReminder.bind(null, clientId), {})
  const [dueDate, setDueDate] = useState('')
  const err = state.fieldErrors ?? {}

  const setPreset = (days: number) => setDueDate(toDateInput(presetDate(days, new Date())))

  const presetBtn =
    'rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'

  return (
    <form action={formAction} className="space-y-2 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setPreset(7)} className={presetBtn}>
          через неделю
        </button>
        <button type="button" onClick={() => setPreset(14)} className={presetBtn}>
          через 2 недели
        </button>
        <button type="button" onClick={() => setPreset(30)} className={presetBtn}>
          через месяц
        </button>
      </div>

      <input
        type="date"
        name="dueDate"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className={inputClass}
      />
      {err.dueDate?.[0] && <p className="text-sm text-red-600 dark:text-red-400">{err.dueDate[0]}</p>}

      <input name="note" placeholder="О чём напомнить (необязательно)" className={inputClass} />

      <SubmitButton>Добавить напоминание</SubmitButton>
    </form>
  )
}
