'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/auth'
import { NAV_ITEMS, isNavActive } from './nav'

export function TopNav({
  isAdmin,
  managerName,
}: {
  isAdmin: boolean
  managerName: string
}) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 hidden border-b border-gray-200 bg-white/90 backdrop-blur md:block dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="mr-4 flex items-center gap-2 font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs text-white">
              GS
            </span>
            Glint &amp; Steel
          </span>
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = isNavActive(href, pathname)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              href="/managers"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isNavActive('/managers', pathname)
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              Менеджеры
            </Link>
          )}
          <Link
            href="/account"
            className="ml-2 hidden rounded-lg px-2 py-2 text-sm text-gray-500 hover:bg-gray-100 lg:inline dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {managerName}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Выйти
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
