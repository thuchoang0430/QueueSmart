import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { ApiError } from '../../errors'
import { prisma } from '../../database/prisma'
import { EMAIL_PATTERN, validateOrThrow, type Schema } from '../../validation/validators'

// Registration and login, backed by PostgreSQL via Prisma. Passwords are stored
// only as bcrypt hashes - the plain text never reaches the database. Sessions,
// by contrast, are deliberately kept in memory (see below): they are disposable
// and a signed stateless token would buy nothing with a single process.

export type AppRole = 'user' | 'admin'

export const MIN_PASSWORD_LENGTH = 6
const SALT_ROUNDS = 10

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

/** The only user shape sent to clients - it never carries the password hash. */
export interface PublicUser {
  id: number
  name: string
  email: string
  role: AppRole
}

export interface AuthResult {
  user: PublicUser
  token: string
}

// Token -> authenticated user. Kept in memory, not the database: sessions are
// disposable and cleared on restart, which is fine. Because the resolved user is
// cached here at login, getUserByToken stays synchronous and the auth middleware
// needs no await.
const sessions = new Map<string, PublicUser>()

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

// The database enum is upper case (USER/ADMIN); the rest of the app - API,
// front end, tests - uses lower case. Map at this boundary so nothing downstream
// has to know about the storage format.
function toAppRole(role: 'USER' | 'ADMIN'): AppRole {
  return role === 'ADMIN' ? 'admin' : 'user'
}

/**
 * Registers a session for an already-authenticated user and returns its token.
 * Shared by login and register; tests use it to mint a session without a
 * round-trip through the async login path.
 */
export function createSession(user: PublicUser): string {
  const token = `session-${randomUUID()}`
  sessions.set(token, user)
  return token
}

export async function register(input: unknown): Promise<AuthResult> {
  validateOrThrow(input, registerSchema)
  const data = input as { name: string; email: string; password: string }
  const email = normaliseEmail(data.email)

  const existing = await prisma.userCredential.findUnique({ where: { email } })
  if (existing) {
    throw ApiError.conflict('An account with that email already exists.')
  }

  const name = data.name.trim()
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

  const credential = await prisma.userCredential.create({
    data: {
      email,
      passwordHash,
      // Role is never read from the request body - otherwise anyone could
      // register themselves as an administrator.
      role: 'USER',
      // The profile is created in the same write so a user is never left with
      // credentials but no profile.
      profile: { create: { fullName: name, email } },
    },
  })

  const user: PublicUser = { id: credential.id, name, email, role: 'user' }
  return { user, token: createSession(user) }
}

export async function login(input: unknown): Promise<AuthResult> {
  validateOrThrow(input, loginSchema)
  const data = input as { email: string; password: string }
  const email = normaliseEmail(data.email)

  const credential = await prisma.userCredential.findUnique({
    where: { email },
    include: { profile: true },
  })

  // Same message for an unknown email and a wrong password, so the response
  // cannot be used to discover which accounts exist.
  if (!credential || !(await bcrypt.compare(data.password, credential.passwordHash))) {
    throw ApiError.unauthorized('Email or password is incorrect.')
  }

  const user: PublicUser = {
    id: credential.id,
    name: credential.profile?.fullName ?? '',
    email: credential.email,
    role: toAppRole(credential.role),
  }
  return { user, token: createSession(user) }
}

/** Resolves a bearer token back to a user. Returns null for unknown tokens. */
export function getUserByToken(token: string | undefined): PublicUser | null {
  if (!token) return null
  return sessions.get(token) ?? null
}

/** Invalidates a token. Safe to call with a token that is already gone. */
export function logout(token: string | undefined): void {
  if (token) sessions.delete(token)
}

/** Test-only: drops every session, simulating a server restart. */
export function clearSessions(): void {
  sessions.clear()
}
