import { prisma } from '@/lib/prisma'
import { deleteManager, setManagerAdmin } from '@/actions/managers'
import { requireAdmin } from '@/lib/session'
import { ManagerForm } from '@/components/ManagerForm'
import { ResetPasswordInline } from '@/components/ResetPasswordInline'

export const dynamic = 'force-dynamic'

export default async function ManagersPage() {
  const me = await requireAdmin()
  const managers = await prisma.manager.findMany({
    where: { deletedAt: null },
    orderBy: [{ isAdmin: 'desc' }, { name: 'asc' }],
  })

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Менеджеры</h1>

      <ManagerForm />

      <div className="space-y-2">
        {managers.map((m) => {
          const isMe = m.id === me.id
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{m.name}</span>
                    {m.isAdmin && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        админ
                      </span>
                    )}
                    {isMe && <span className="text-xs text-gray-400">это вы</span>}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                    {m.email ?? 'без входа'}
                  </div>
                </div>
              </div>

              {!isMe && (
                <>
                  <div className="mt-3 flex gap-2">
                    <form action={setManagerAdmin.bind(null, m.id, !m.isAdmin)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        {m.isAdmin ? 'Убрать админа' : 'Сделать админом'}
                      </button>
                    </form>
                    <form action={deleteManager.bind(null, m.id)}>
                      <button
                        type="submit"
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        Удалить
                      </button>
                    </form>
                  </div>
                  <ResetPasswordInline managerId={m.id} />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
