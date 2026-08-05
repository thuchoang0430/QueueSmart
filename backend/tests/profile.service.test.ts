import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../src/errors'
import { getProfile } from '../src/modules/profile/profile.service'
import { disconnectDb, resetUsers } from './db'

beforeEach(async () => {
  await resetUsers()
})

afterAll(disconnectDb)

describe('getProfile', () => {
  it('returns the seeded user profile', async () => {
    const profile = await getProfile(1)
    expect(profile).toEqual({
      fullName: 'Student User',
      email: 'user@test.com',
      contactInfo: null,
      preferences: null,
    })
  })

  it('returns the admin profile', async () => {
    expect((await getProfile(2)).email).toBe('admin@test.com')
  })

  it('throws 404 when the user has no profile', async () => {
    try {
      await getProfile(9999)
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).status).toBe(404)
    }
  })
})
