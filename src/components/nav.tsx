import type { SVGProps } from 'react'

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  )
}

function OrdersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="M9 10h6M9 14h6M9 18h4" />
    </svg>
  )
}

function ClientsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M17.5 20a5.5 5.5 0 0 0-2.7-4.7" />
    </svg>
  )
}

export type NavItem = {
  href: string
  label: string
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Сегодня', Icon: HomeIcon },
  { href: '/orders', label: 'Заказы', Icon: OrdersIcon },
  { href: '/clients', label: 'Клиенты', Icon: ClientsIcon },
]

/** Активен ли пункт навигации для текущего пути. */
export function isNavActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}
