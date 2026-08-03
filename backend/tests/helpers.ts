import { login } from '../src/modules/auth/auth.service'

// Shared test helpers. Call resetStore() before using these - they log in as
// the seeded accounts, which only exist after a reset.

export function adminToken(): string {
  return login({ email: 'admin@test.com', password: 'password' }).token
}

export function userToken(): string {
  return login({ email: 'user@test.com', password: 'password' }).token
}

/** Formats a token for the Authorization header. */
export function bearer(token: string): string {
  return `Bearer ${token}`
}
