export const SESSION_COOKIE = 'crm_session'

const PAYLOAD = 'v1'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 дней

const encoder = new TextEncoder()

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Сравнение строк, устойчивое по времени (защита от timing-атак). */
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

/**
 * Создаёт подписанный токен сессии: «payload.hmac».
 * Использует Web Crypto (crypto.subtle), поэтому работает и в Node,
 * и в Edge Runtime (где выполняется middleware).
 */
export async function signSession(secret: string): Promise<string> {
  const hmac = await hmacHex(secret, PAYLOAD)
  return `${PAYLOAD}.${hmac}`
}

/** Проверяет подпись токена сессии. */
export async function verifySession(token: string, secret: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payload, hmac] = parts
  if (payload !== PAYLOAD || !hmac) return false

  const expected = await hmacHex(secret, PAYLOAD)
  return safeEqual(hmac, expected)
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET не задан или слишком короткий (минимум 16 символов)')
  }
  return secret
}

/**
 * Ставит httpOnly cookie-сессию на 30 дней.
 * next/headers импортируется лениво, чтобы модуль можно было тестировать
 * без серверного контекста Next.js.
 */
export async function createSession(): Promise<void> {
  const { cookies } = await import('next/headers')
  const token = await signSession(getSecret())
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
