import { createSession, type PublicUser } from '../src/modules/auth/auth.service'

// Shared test helpers. These mint a session directly instead of calling the
// async login(), so they stay synchronous and every existing route test keeps
// working without an await. The ids match both the Prisma seed (see tests/db.ts)
// and the in-memory store seed, so handlers that look a user up by id in either
// place resolve the same account.

const DEMO_USER: PublicUser = { id: 1, name: 'Student User', email: 'user@test.com', role: 'user' }
const DEMO_ADMIN: PublicUser = { id: 2, name: 'Admin User', email: 'admin@test.com', role: 'admin' }

export function adminToken(): string {
  return createSession(DEMO_ADMIN)
}

export function userToken(): string {
  return createSession(DEMO_USER)
}

/** Formats a token for the Authorization header. */
export function bearer(token: string): string {
  return `Bearer ${token}`
}
