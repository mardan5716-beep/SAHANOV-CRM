import { requireManager } from '@/lib/session'
import { logout } from '@/actions/auth'
import { PasswordChangeForm } from '@/components/PasswordChangeForm'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const m = await requireManager()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Профиль</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="text-lg font-semibold">{m.name}</div>
        <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{m.email}</div>
        <div className="mt-2">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {m.isAdmin ? 'Администратор' : 'Менеджер'}
          </span>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Смена пароля</h2>
        <PasswordChangeForm />
      </section>

      <form action={logout}>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 px-4 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.99] dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Выйти
        </button>
      </form>
    </div>
  )
}
