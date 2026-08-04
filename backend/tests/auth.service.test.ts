import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../src/errors'
import {
  clearSessions,
  getUserByToken,
  login,
  logout,
  register,
} from '../src/modules/auth/auth.service'
import { prisma } from '../src/database/prisma'
import { disconnectDb, resetUsers } from './db'

beforeEach(async () => {
  await resetUsers()
  clearSessions()
})

afterAll(disconnectDb)

const validSignup = {
  name: 'Andy Do',
  email: 'andy@test.edu',
  password: 'password123',
}

/** Number of credential rows currently in the database. */
function userCount(): Promise<number> {
  return prisma.userCredential.count()
}

describe('register', () => {
  it('creates an account and returns a user with a token', async () => {
    const result = await register(validSignup)
    expect(result.user).toMatchObject({ name: 'Andy Do', email: 'andy@test.edu', role: 'user' })
    expect(result.token).toMatch(/^session-/)
    expect(await userCount()).toBe(3)
  })

  it('persists the account so it survives beyond the request', async () => {
    await register(validSignup)
    const stored = await prisma.userCredential.findUnique({ where: { email: 'andy@test.edu' } })
    expect(stored).not.toBeNull()
  })

  it('stores the password only as a bcrypt hash, never plain text', async () => {
    await register(validSignup)
    const stored = await prisma.userCredential.findUnique({ where: { email: 'andy@test.edu' } })
    expect(stored?.passwordHash).not.toBe('password123')
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$/)
  })

  it('never returns the password', async () => {
    const result = await register(validSignup)
    expect(result.user).not.toHaveProperty('password')
  })

  it('always assigns the user role, even if the body asks for admin', async () => {
    const result = await register({ ...validSignup, role: 'admin' })
    expect(result.user.role).toBe('user')
  })

  it('lowercases and trims the email so logins are case insensitive', async () => {
    const result = await register({ ...validSignup, email: '  Andy@Test.EDU  ' })
    expect(result.user.email).toBe('andy@test.edu')
  })

  it('trims the name', async () => {
    expect((await register({ ...validSignup, name: '  Andy Do  ' })).user.name).toBe('Andy Do')
  })

  it('rejects a duplicate email regardless of casing', async () => {
    await register(validSignup)
    try {
      await register({ ...validSignup, email: 'ANDY@TEST.EDU' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).status).toBe(409)
    }
    expect(await userCount()).toBe(3)
  })

  it('rejects a duplicate of a seeded account', async () => {
    await expect(register({ ...validSignup, email: 'admin@test.com' })).rejects.toThrow(ApiError)
  })

  it('reports every missing field at once', async () => {
    try {
      await register({})
      expect.unreachable('should have thrown')
    } catch (err) {
      const fields = (err as ApiError).fields ?? {}
      expect(Object.keys(fields).sort()).toEqual(['email', 'name', 'password'])
    }
  })

  it('rejects a malformed email', async () => {
    try {
      await register({ ...validSignup, email: 'not-an-email' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.email).toBe('Email must be a valid address.')
    }
  })

  it('rejects a password under the minimum length', async () => {
    try {
      await register({ ...validSignup, password: '12345' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.password).toBe('Password must be at least 6 characters.')
    }
  })

  it('accepts a password exactly at the minimum length', async () => {
    await expect(register({ ...validSignup, password: '123456' })).resolves.toBeDefined()
  })

  it('rejects a name over the 50 character limit', async () => {
    try {
      await register({ ...validSignup, name: 'x'.repeat(51) })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.name).toBe('Name must be 50 characters or fewer.')
    }
  })

  it('rejects a name sent as a number', async () => {
    try {
      await register({ ...validSignup, name: 12345 })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.name).toBe('Name must be text.')
    }
  })

  it('does not create an account when validation fails', async () => {
    await expect(register({})).rejects.toThrow(ApiError)
    expect(await userCount()).toBe(2)
  })
})

describe('login', () => {
  it('signs in a seeded user', async () => {
    const result = await login({ email: 'user@test.com', password: 'password' })
    expect(result.user.role).toBe('user')
    expect(result.token).toBeTruthy()
  })

  it('signs in a seeded admin with the admin role', async () => {
    expect((await login({ email: 'admin@test.com', password: 'password' })).user.role).toBe('admin')
  })

  it('signs in an account created through register', async () => {
    await register(validSignup)
    await expect(
      login({ email: validSignup.email, password: validSignup.password }),
    ).resolves.toBeDefined()
  })

  it('ignores email casing and surrounding spaces', async () => {
    await expect(login({ email: '  ADMIN@test.com ', password: 'password' })).resolves.toBeDefined()
  })

  it('rejects a wrong password with 401', async () => {
    try {
      await login({ email: 'user@test.com', password: 'wrong' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).status).toBe(401)
    }
  })

  it('gives the same message for an unknown email as for a wrong password', async () => {
    const messageFrom = async (email: string, password: string): Promise<string> => {
      try {
        await login({ email, password })
        return ''
      } catch (err) {
        return (err as ApiError).message
      }
    }

    const unknown = await messageFrom('nobody@test.com', 'password')
    const wrongPassword = await messageFrom('user@test.com', 'wrong')
    expect(unknown).toBe(wrongPassword)
  })

  it('requires both fields', async () => {
    try {
      await login({})
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(Object.keys((err as ApiError).fields ?? {}).sort()).toEqual(['email', 'password'])
    }
  })

  it('issues a different token on each login', async () => {
    const first = (await login({ email: 'user@test.com', password: 'password' })).token
    const second = (await login({ email: 'user@test.com', password: 'password' })).token
    expect(first).not.toBe(second)
  })
})

describe('getUserByToken', () => {
  it('resolves a token issued by login', async () => {
    const { token } = await login({ email: 'admin@test.com', password: 'password' })
    expect(getUserByToken(token)?.email).toBe('admin@test.com')
  })

  it('resolves a token issued by register', async () => {
    const { token } = await register(validSignup)
    expect(getUserByToken(token)?.email).toBe('andy@test.edu')
  })

  it('returns null for an unknown token', () => {
    expect(getUserByToken('session-does-not-exist')).toBeNull()
  })

  it('returns null when no token is given', () => {
    expect(getUserByToken(undefined)).toBeNull()
    expect(getUserByToken('')).toBeNull()
  })

  it('returns null after sessions are cleared, simulating a server restart', async () => {
    const { token } = await login({ email: 'user@test.com', password: 'password' })
    clearSessions()
    expect(getUserByToken(token)).toBeNull()
  })
})

describe('logout', () => {
  it('invalidates the token', async () => {
    const { token } = await login({ email: 'user@test.com', password: 'password' })
    logout(token)
    expect(getUserByToken(token)).toBeNull()
  })

  it('leaves other sessions alone', async () => {
    const first = (await login({ email: 'user@test.com', password: 'password' })).token
    const second = (await login({ email: 'user@test.com', password: 'password' })).token
    logout(first)
    expect(getUserByToken(second)).not.toBeNull()
  })

  it('does nothing when given no token', () => {
    expect(() => logout(undefined)).not.toThrow()
  })
})
