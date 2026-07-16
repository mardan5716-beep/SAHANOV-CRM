'use client'

import { useFormState } from 'react-dom'
import { SubmitButton } from './SubmitButton'
import type { ClientFormState } from '@/actions/clients'

export type ClientDefaults = {
  name?: string
  phone?: string | null
  address?: string | null
  notes?: string | null
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900'

const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export function ClientForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (state: ClientFormState, formData: FormData) => Promise<ClientFormState>
  defaults?: ClientDefaults
  submitLabel: string
}) {
  const [state, formAction] = useFormState(action, {} as ClientFormState)
  const err = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Имя
        </label>
        <input
          id="name"
          name="name"
          defaultValue={defaults.name ?? ''}
          placeholder="Имя клиента"
          className={inputClass}
        />
        {err.name?.[0] && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {err.name[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>
          Телефон
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={defaults.phone ?? ''}
          placeholder="+7 900 000-00-00"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>
          Адрес
        </label>
        <input
          id="address"
          name="address"
          defaultValue={defaults.address ?? ''}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Заметки
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaults.notes ?? ''}
          className={inputClass}
        />
      </div>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  )
}
