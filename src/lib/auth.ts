export const SESSION_COOKIE = 'crm_session'

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 дней
const encoder = new TextEncoder()

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return toHex(signature)
}

/** Подписывает произвольную полезную нагрузку (id менеджера): «payload.hmac». */
export async function signSession(payload: string, secret: string): Promise<string> {
  const hmac = await hmacHex(secret, payload)
  return `${payload}.${hmac}`
}

/** Проверяет токен; возвращает payload (id менеджера) или null. */
export async function verifySession(token: string, secret: string): Promise<string | null> {
  if (!token || typeof token !== 'string') return null
  const idx = token.lastIndexOf('.')
  if (idx <= 0) return null
  const payload = token.slice(0, idx)
  const hmac = token.slice(idx + 1)
  if (!payload || !hmac) return null
  const expected = await hmacHex(secret, payload)
  return safeEqual(hmac, expected) ? payload : null
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET не задан или слишком короткий (минимум 16 символов)')
  }
  return secret
}

/** Ставит httpOnly cookie-сессию для менеджера на 30 дней. */
export async function createSession(managerId: string): Promise<void> {
  const { cookies } = await import('next/headers')
  const token = await signSession(managerId, getSecret())
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

/** Удаляет cookie-сессию (выход). */
export async function destroySession(): Promise<void> {
  const { cookies } = await import('next/headers')
  cookies().delete(SESSION_COOKIE)
}

/** Возвращает id вошедшего менеджера из cookie (или null). */
export async function getSessionManagerId(): Promise<string | null> {
  const { cookies } = await import('next/headers')
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token, getSecret())
}
