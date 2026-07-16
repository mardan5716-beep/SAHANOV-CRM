import { describe, it, expect } from 'vitest'
import { signSession, verifySession } from './auth'

describe('подпись сессии', () => {
  const secret = 'test-secret-0123456789abcdef0123456789'

  it('подписанный токен проходит проверку тем же секретом', async () => {
    const token = await signSession(secret)
    expect(await verifySession(token, secret)).toBe(true)
  })

  it('токен не проходит проверку чужим секретом', async () => {
    const token = await signSession(secret)
    expect(await verifySession(token, 'completely-other-secret-value-xyz')).toBe(false)
  })

  it('мусорный токен не проходит проверку', async () => {
    expect(await verifySession('garbage', secret)).toBe(false)
  })

  it('пустой токен не проходит проверку', async () => {
    expect(await verifySession('', secret)).toBe(false)
  })

  it('подделанная подпись не проходит проверку', async () => {
    const token = await signSession(secret)
    const tampered = token.slice(0, -4) + '0000'
    expect(await verifySession(tampered, secret)).toBe(false)
  })
})
