import { Status } from '@prisma/client'

/** Порядок статусов в воронке заказа. */
export const STATUS_ORDER: Status[] = [
  Status.NEW,
  Status.MEASURE,
  Status.PRODUCTION,
  Status.INSTALL,
  Status.DONE,
]

const LABELS: Record<Status, string> = {
  NEW: 'Заявка',
  MEASURE: 'Замер',
  PRODUCTION: 'Производство',
  INSTALL: 'Монтаж',
  DONE: 'Завершён',
}

/** Классы Tailwind для цветного бейджа статуса (light + dark). */
const BADGE_CLASSES: Record<Status, string> = {
  NEW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100',
  MEASURE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  PRODUCTION: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  INSTALL: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
}

/** Классы Tailwind для активной кнопки-шага в StatusStepper. */
const STEP_ACTIVE_CLASSES: Record<Status, string> = {
  NEW: 'bg-gray-500 text-white',
  MEASURE: 'bg-blue-600 text-white',
  PRODUCTION: 'bg-orange-500 text-white',
  INSTALL: 'bg-purple-600 text-white',
  DONE: 'bg-green-600 text-white',
}

export function statusLabel(status: Status): string {
  return LABELS[status]
}

export function statusBadgeClass(status: Status): string {
  return BADGE_CLASSES[status]
}

export function statusStepActiveClass(status: Status): string {
  return STEP_ACTIVE_CLASSES[status]
}

/** Следующий статус в воронке или null, если заказ уже завершён. */
export function nextStatus(status: Status): Status | null {
  const i = STATUS_ORDER.indexOf(status)
  if (i < 0 || i >= STATUS_ORDER.length - 1) return null
  return STATUS_ORDER[i + 1]
}
