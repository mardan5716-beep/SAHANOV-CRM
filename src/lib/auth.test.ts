import { describe, it, expect } from 'vitest'
import { signSession, verifySession } from './auth'

describe('сессия менеджера', () => {
  const secret = 'test-secret-0123456789abcdef0123456789'

  it('подписанный токен возвращает id менеджера', async () => {
    const token = await signSession('mgr_abc123', secret)
    expect(await verifySession(token, secret)).toBe('mgr_abc123')
  })

  it('токен с чужим секретом → null', async () => {
    const token = await signSession('mgr_abc123', secret)
    expect(await verifySession(token, 'completely-other-secret-value-xyz')).toBeNull()
  })

  it('мусорный токен → null', async () => {
    expect(await verifySession('garbage', secret)).toBeNull()
  })

  it('пустой токен → null', async () => {
    expect(await verifySession('', secret)).toBeNull()
  })

  it('подделанная подпись → null', async () => {
    const token = await signSession('mgr_abc123', secret)
    const tampered = token.slice(0, -4) + '0000'
    expect(await verifySession(tampered, secret)).toBeNull()
  })
})
