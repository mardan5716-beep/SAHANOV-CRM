import { prisma } from '@/lib/prisma'
import { deleteManager } from '@/actions/managers'
import { ManagerForm } from '@/components/ManagerForm'

export const dynamic = 'force-dynamic'

export default async function ManagersPage() {
  const managers = await prisma.manager.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Менеджеры</h1>

      <ManagerForm />

      {managers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-800">
          Пока нет менеджеров
        </p>
      ) : (
        <div className="space-y-2">
          {managers.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <span className="font-medium">{m.name}</span>
              <form action={deleteManager.bind(null, m.id)}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Удалить
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
