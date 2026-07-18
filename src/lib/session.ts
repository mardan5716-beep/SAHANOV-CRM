import { redirect } from 'next/navigation'
import type { Manager } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSessionManagerId } from '@/lib/auth'

/** Текущий вошедший менеджер или null (в т.ч. если запись удалена). */
export async function getCurrentManager(): Promise<Manager | null> {
  const id = await getSessionManagerId()
  if (!id) return null
  return prisma.manager.findFirst({ where: { id, deletedAt: null } })
}

/** Требует авторизации: возвращает менеджера или редиректит на /login. */
export async function requireManager(): Promise<Manager> {
  const manager = await getCurrentManager()
  if (!manager) redirect('/login')
  return manager
}

/** Требует прав администратора: иначе редирект на дашборд. */
export async function requireAdmin(): Promise<Manager> {
  const manager = await requireManager()
  if (!manager.isAdmin) redirect('/')
  return manager
}
