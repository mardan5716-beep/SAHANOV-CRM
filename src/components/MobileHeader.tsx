import Link from 'next/link'
import { SahanovLogo } from './SahanovLogo'

export function MobileHeader({ managerName }: { managerName: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden dark:border-gray-800 dark:bg-gray-950/90">
      <Link href="/" className="flex items-center gap-2 font-bold tracking-wide">
        <SahanovLogo className="h-8 w-8" />
        SAKHANOV
      </Link>
      <Link
        href="/account"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
        <span className="max-w-[110px] truncate">{managerName}</span>
      </Link>
    </header>
  )
}
