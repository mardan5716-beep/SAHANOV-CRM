'use client'

import { useFormState } from 'react-dom'
import { Status } from '@prisma/client'
import { STATUS_ORDER, statusLabel } from '@/lib/status'
import { SubmitButton } from './SubmitButton'
import type { OrderFormState } from '@/actions/orders'

type ClientOption = { id: string; name: string }

export type OrderDefaults = {
  clientId?: string
  title?: string
  description?: string | null
  status?: Status
  price?: string
  prepaid?: string
  measureDate?: string
  dueDate?: string
  notes?: string | null
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900'

const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export function OrderForm({
  action,
  clients,
  defaults = {},
  submitLabel,
}: {
  action: (state: OrderFormState, formData: FormData) => Promise<OrderFormState>
  clients: ClientOption[]
  defaults?: OrderDefaults
  submitLabel: string
}) {
  const [state, formAction] = useFormState(action, {} as OrderFormState)
  const err = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="clientId" className={labelClass}>
          Клиент
        </label>
        <select
          id="clientId"
          name="clientId"
          defaultValue={defaults.clientId ?? ''}
          className={inputClass}
        >
          <option value="" disabled>
            Выберите клиента
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError messages={err.clientId} />
      </div>

      <div>
        <label htmlFor="title" className={labelClass}>
          Название заказа
        </label>
        <input
          id="title"
          name="title"
          defaultValue={defaults.title ?? ''}
          placeholder="Например: Перила на лестницу"
          className={inputClass}
        />
        <FieldError messages={err.title} />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Описание
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaults.description ?? ''}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Статус
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaults.status ?? Status.NEW}
          className={inputClass}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className={labelClass}>
            Сумма, ₸
          </label>
          <input
            id="price"
            name="price"
            inputMode="numeric"
            defaultValue={defaults.price ?? ''}
            placeholder="0"
            className={inputClass}
          />
          <FieldError messages={err.price} />
        </div>
        <div>
          <label htmlFor="prepaid" className={labelClass}>
            Предоплата, ₸
          </label>
          <input
            id="prepaid"
            name="prepaid"
            inputMode="numeric"
            defaultValue={defaults.prepaid ?? ''}
            placeholder="0"
            className={inputClass}
          />
          <FieldError messages={err.prepaid} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="measureDate" className={labelClass}>
            Дата замера
          </label>
          <input
            id="measureDate"
            name="measureDate"
            type="date"
            defaultValue={defaults.measureDate ?? ''}
            className={inputClass}
          />
          <FieldError messages={err.measureDate} />
        </div>
        <div>
          <label htmlFor="dueDate" className={labelClass}>
            Срок сдачи
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={defaults.dueDate ?? ''}
            className={inputClass}
          />
          <FieldError messages={err.dueDate} />
        </div>
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

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null
  return (
    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{messages[0]}</p>
  )
}
