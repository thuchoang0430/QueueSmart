import { randomUUID } from 'node:crypto'
import { ApiError } from '../../errors'
import { nextId, store, type Role, type User } from '../../store/memoryStore'
import { EMAIL_PATTERN, validateOrThrow, type Schema } from '../../validation/validators'

// Registration and login. Sessions are a token -> userId map in the store
// rather than JWTs: with a single process and no database there is nothing for
// a signed stateless token to buy us. Passwords are plain text for the same
// reason - hashing lands with real persistence in A4.

export const MIN_PASSWORD_LENGTH = 6

export const registerSchema: Schema = {
  name: { required: true, type: 'string', minLength: 2, maxLength: 50, label: 'Name' },
  email: {
    required: true,
    type: 'string',
    maxLength: 100,
    pattern: EMAIL_PATTERN,
    patternMessage: 'Email must be a valid address.',
    label: 'Email',
  },
  password: {
    required: true,
    type: 'string',
    minLength: MIN_PASSWORD_LENGTH,
    maxLength: 72,
    label: 'Password',
  },
}

// Login deliberately checks only presence. Applying the length rules here
// would tell an attacker which passwords are too short to be real.
export const loginSchema: Schema = {
  email: { required: true, type: 'string', label: 'Email' },
  password: { required: true, type: 'string', label: 'Password' },
}

/** A user with the password stripped. This is the only shape sent to clients. */
export interface PublicUser {
  id: number
  name: string
  email: string
  role: Role
}

export interface AuthResult {
  user: PublicUser
  token: string
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

function findByEmail(email: string): User | undefined {
  const target = normaliseEmail(email)
  return store.users.find((u) => u.email.toLowerCase() === target)
}

function startSession(user: User): string {
  const token = `session-${randomUUID()}`
  store.sessions.set(token, user.id)
  return token
}

export function register(input: unknown): AuthResult {
  validateOrThrow(input, registerSchema)
  const data = input as { name: string; email: string; password: string }

  if (findByEmail(data.email)) {
    throw ApiError.conflict('An account with that email already exists.')
  }

  const user: User = {
    id: nextId('users'),
    name: data.name.trim(),
    email: normaliseEmail(data.email),
    password: data.password,
    // Role is never read from the request body - otherwise anyone could
    // register themselves as an administrator.
    role: 'user',
  }

  store.users.push(user)
  return { user: toPublicUser(user), token: startSession(user) }
}

export function login(input: unknown): AuthResult {
  validateOrThrow(input, loginSchema)
  const data = input as { email: string; password: string }

  const user = findByEmail(data.email)
  // Same message for an unknown email and a wrong password, so the response
  // cannot be used to discover which accounts exist.
  if (!user || user.password !== data.password) {
    throw ApiError.unauthorized('Email or password is incorrect.')
  }

  return { user: toPublicUser(user), token: startSession(user) }
}

/** Resolves a bearer token back to a user. Returns null for unknown tokens. */
export function getUserByToken(token: string | undefined): User | null {
  if (!token) return null
  const userId = store.sessions.get(token)
  if (userId === undefined) return null
  return store.users.find((u) => u.id === userId) ?? null
}

/** Invalidates a token. Safe to call with a token that is already gone. */
export function logout(token: string | undefined): void {
  if (token) store.sessions.delete(token)
}
