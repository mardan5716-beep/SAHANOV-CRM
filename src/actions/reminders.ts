'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { parseReminder } from '@/lib/validation'
import { requireManager } from '@/lib/session'

export type ReminderState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function createReminder(
  clientId: string,
  _prevState: ReminderState,
  formData: FormData,
): Promise<ReminderState> {
  await requireManager()
  const parsed = parseReminder(formData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }
  await prisma.reminder.create({
    data: { clientId, dueDate: parsed.data.dueDate, note: parsed.data.note },
  })
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/')
  return {}
}

/** Отметить напоминание выполненным. */
export async function completeReminder(id: string): Promise<void> {
  await requireManager()
  const r = await prisma.reminder.update({
    where: { id },
    data: { doneAt: new Date() },
  })
  revalidatePath(`/clients/${r.clientId}`)
  revalidatePath('/')
}

/** Удалить напоминание (мягко). */
export async function deleteReminder(id: string): Promise<void> {
  await requireManager()
  const r = await prisma.reminder.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  revalidatePath(`/clients/${r.clientId}`)
  revalidatePath('/')
}
