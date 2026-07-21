function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** Напоминание пора показать: срок сегодня или раньше. */
export function isReminderDue(dueDate: Date, now: Date): boolean {
  return dueDate.getTime() <= endOfDay(now).getTime()
}

/** Напоминание просрочено: срок раньше начала сегодняшнего дня. */
export function isReminderOverdue(dueDate: Date, now: Date): boolean {
  return dueDate.getTime() < startOfDay(now).getTime()
}

/** Дата через `days` дней от `now` (полдень) — для быстрых кнопок. */
export function presetDate(days: number, now: Date): Date {
  const x = new Date(now)
  x.setHours(12, 0, 0, 0)
  x.setDate(x.getDate() + days)
  return x
}
