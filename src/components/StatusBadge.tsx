import type { Status } from '@prisma/client'
import { statusBadgeClass, statusLabel } from '@/lib/status'

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
    >
      {statusLabel(status)}
    </span>
  )
}
