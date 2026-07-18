import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('пароли', () => {
  it('верный пароль проходит проверку', async () => {
    const h = await hashPassword('secret123')
    expect(await verifyPassword('secret123', h)).toBe(true)
  })

  it('неверный пароль не проходит', async () => {
    const h = await hashPassword('secret123')
    expect(await verifyPassword('wrong', h)).toBe(false)
  })

  it('один пароль хешируется по-разному (разная соль)', async () => {
    const a = await hashPassword('samepass')
    const b = await hashPassword('samepass')
    expect(a).not.toBe(b)
    expect(await verifyPassword('samepass', a)).toBe(true)
    expect(await verifyPassword('samepass', b)).toBe(true)
  })

  it('битый формат хеша → false', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false)
    expect(await verifyPassword('x', '')).toBe(false)
  })
})
