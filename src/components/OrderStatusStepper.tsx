'use client'

import type { OrderStatus } from '@prisma/client'
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_TERMINAL,
  orderStatusLabel,
  orderStatusStepActiveClass,
} from '@/lib/enums'
import { setStatus } from '@/actions/orders'

/** Кнопки-шаги воронки заказа + терминальные (Возврат/Отмена). */
export function OrderStatusStepper({
  orderId,
  status,
}: {
  orderId: string
  status: OrderStatus
}) {
  const button = (s: OrderStatus, terminal = false) => {
    const active = s === status
    return (
      <form key={s} action={setStatus.bind(null, orderId, s)}>
        <button
          type="submit"
          disabled={active}
          className={`rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-default ${
            active
              ? orderStatusStepActiveClass(s)
              : terminal
                ? 'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
          }`}
        >
          {orderStatusLabel(s)}
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ORDER_STATUS_FLOW.map((s) => button(s))}
      </div>
      <div className="flex flex-wrap gap-2">
        {ORDER_STATUS_TERMINAL.map((s) => button(s, true))}
      </div>
    </div>
  )
}
