'use client'

import type { Status } from '@prisma/client'
import { STATUS_ORDER, statusLabel, statusStepActiveClass } from '@/lib/status'
import { setStatus } from '@/actions/orders'

/** Кнопки-шаги воронки: тап по статусу переводит заказ в него. */
export function StatusStepper({
  orderId,
  status,
}: {
  orderId: string
  status: Status
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_ORDER.map((s) => {
        const active = s === status
        return (
          <form key={s} action={setStatus.bind(null, orderId, s)}>
            <button
              type="submit"
              disabled={active}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-default ${
                active
                  ? statusStepActiveClass(s)
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {statusLabel(s)}
            </button>
          </form>
        )
      })}
    </div>
  )
}
