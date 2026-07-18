import type { OrderStatus, PaymentStatus } from '@prisma/client'
import {
  orderStatusLabel,
  orderStatusBadgeClass,
  paymentStatusLabel,
  paymentStatusBadgeClass,
} from '@/lib/enums'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusBadgeClass(status)}`}
    >
      {orderStatusLabel(status)}
    </span>
  )
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusBadgeClass(status)}`}
    >
      {paymentStatusLabel(status)}
    </span>
  )
}
