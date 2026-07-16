import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

/** Публичные пути, не требующие авторизации. */
const PUBLIC_PATHS = ['/login']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value ?? ''
  const secret = process.env.SESSION_SECRET ?? ''

  if (secret && (await verifySession(token, secret))) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Пропускаем статику, служебные пути Next и файлы с расширениями (иконки, манифест).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-|apple-|.*\\.).*)'],
}
