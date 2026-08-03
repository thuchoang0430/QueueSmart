import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../src/errors'
import {
  getUserByToken,
  login,
  logout,
  register,
  toPublicUser,
} from '../src/modules/auth/auth.service'
import { resetStore, store } from '../src/store/memoryStore'

beforeEach(() => {
  resetStore()
})

const validSignup = {
  name: 'Andy Do',
  email: 'andy@test.edu',
  password: 'password123',
}

describe('register', () => {
  it('creates an account and returns a user with a token', () => {
    const result = register(validSignup)
    expect(result.user).toMatchObject({ name: 'Andy Do', email: 'andy@test.edu', role: 'user' })
    expect(result.token).toMatch(/^session-/)
    expect(store.users).toHaveLength(3)
  })

  it('never returns the password', () => {
    const result = register(validSignup)
    expect(result.user).not.toHaveProperty('password')
  })

  it('always assigns the user role, even if the body asks for admin', () => {
    const result = register({ ...validSignup, role: 'admin' })
    expect(result.user.role).toBe('user')
  })

  it('lowercases and trims the email so logins are case insensitive', () => {
    const result = register({ ...validSignup, email: '  Andy@Test.EDU  ' })
    expect(result.user.email).toBe('andy@test.edu')
  })

  it('trims the name', () => {
    expect(register({ ...validSignup, name: '  Andy Do  ' }).user.name).toBe('Andy Do')
  })

  it('rejects a duplicate email regardless of casing', () => {
    register(validSignup)
    try {
      register({ ...validSignup, email: 'ANDY@TEST.EDU' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).status).toBe(409)
    }
    expect(store.users).toHaveLength(3)
  })

  it('rejects a duplicate of a seeded account', () => {
    expect(() => register({ ...validSignup, email: 'admin@test.com' })).toThrow(ApiError)
  })

  it('reports every missing field at once', () => {
    try {
      register({})
      expect.unreachable('should have thrown')
    } catch (err) {
      const fields = (err as ApiError).fields ?? {}
      expect(Object.keys(fields).sort()).toEqual(['email', 'name', 'password'])
    }
  })

  it('rejects a malformed email', () => {
    try {
      register({ ...validSignup, email: 'not-an-email' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.email).toBe('Email must be a valid address.')
    }
  })

  it('rejects a password under the minimum length', () => {
    try {
      register({ ...validSignup, password: '12345' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.password).toBe('Password must be at least 6 characters.')
    }
  })

  it('accepts a password exactly at the minimum length', () => {
    expect(() => register({ ...validSignup, password: '123456' })).not.toThrow()
  })

  it('rejects a name over the 50 character limit', () => {
    try {
      register({ ...validSignup, name: 'x'.repeat(51) })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.name).toBe('Name must be 50 characters or fewer.')
    }
  })

  it('rejects a name sent as a number', () => {
    try {
      register({ ...validSignup, name: 12345 })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.name).toBe('Name must be text.')
    }
  })

  it('does not create an account when validation fails', () => {
    expect(() => register({})).toThrow(ApiError)
    expect(store.users).toHaveLength(2)
  })
})

describe('login', () => {
  it('signs in a seeded user', () => {
    const result = login({ email: 'user@test.com', password: 'password' })
    expect(result.user.role).toBe('user')
    expect(result.token).toBeTruthy()
  })

  it('signs in a seeded admin with the admin role', () => {
    expect(login({ email: 'admin@test.com', password: 'password' }).user.role).toBe('admin')
  })

  it('signs in an account created through register', () => {
    register(validSignup)
    expect(() => login({ email: validSignup.email, password: validSignup.password })).not.toThrow()
  })

  it('ignores email casing and surrounding spaces', () => {
    expect(() => login({ email: '  ADMIN@test.com ', password: 'password' })).not.toThrow()
  })

  it('rejects a wrong password with 401', () => {
    try {
      login({ email: 'user@test.com', password: 'wrong' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).status).toBe(401)
    }
  })

  it('gives the same message for an unknown email as for a wrong password', () => {
    const unknown = (() => {
      try {
        login({ email: 'nobody@test.com', password: 'password' })
      } catch (err) {
        return (err as ApiError).message
      }
    })()

    const wrongPassword = (() => {
      try {
        login({ email: 'user@test.com', password: 'wrong' })
      } catch (err) {
        return (err as ApiError).message
      }
    })()

    expect(unknown).toBe(wrongPassword)
  })

  it('requires both fields', () => {
    try {
      login({})
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(Object.keys((err as ApiError).fields ?? {}).sort()).toEqual(['email', 'password'])
    }
  })

  it('issues a different token on each login', () => {
    const first = login({ email: 'user@test.com', password: 'password' }).token
    const second = login({ email: 'user@test.com', password: 'password' }).token
    expect(first).not.toBe(second)
  })
})

describe('getUserByToken', () => {
  it('resolves a token issued by login', () => {
    const { token } = login({ email: 'admin@test.com', password: 'password' })
    expect(getUserByToken(token)?.email).toBe('admin@test.com')
  })

  it('resolves a token issued by register', () => {
    const { token } = register(validSignup)
    expect(getUserByToken(token)?.email).toBe('andy@test.edu')
  })

  it('returns null for an unknown token', () => {
    expect(getUserByToken('session-does-not-exist')).toBeNull()
  })

  it('returns null when no token is given', () => {
    expect(getUserByToken(undefined)).toBeNull()
    expect(getUserByToken('')).toBeNull()
  })

  it('returns null after the store is reset, simulating a server restart', () => {
    const { token } = login({ email: 'user@test.com', password: 'password' })
    resetStore()
    expect(getUserByToken(token)).toBeNull()
  })
})

describe('logout', () => {
  it('invalidates the token', () => {
    const { token } = login({ email: 'user@test.com', password: 'password' })
    logout(token)
    expect(getUserByToken(token)).toBeNull()
  })

  it('leaves other sessions alone', () => {
    const first = login({ email: 'user@test.com', password: 'password' }).token
    const second = login({ email: 'user@test.com', password: 'password' }).token
    logout(first)
    expect(getUserByToken(second)).not.toBeNull()
  })

  it('does nothing when given no token', () => {
    expect(() => logout(undefined)).not.toThrow()
  })
})

describe('toPublicUser', () => {
  it('strips the password', () => {
    const publicUser = toPublicUser(store.users[0])
    expect(publicUser).toEqual({
      id: 1,
      name: 'Student User',
      email: 'user@test.com',
      role: 'user',
    })
  })
})
