import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../src/errors'
import { getProfile, updateProfile } from '../src/modules/profile/profile.service'
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

describe('updateProfile', () => {
  const validUpdate = {
    fullName: 'Updated Name',
    contactInfo: '555-0100',
    preferences: 'email notifications',
  }

  it('updates every editable field and returns the new profile', async () => {
    const result = await updateProfile(1, validUpdate)
    expect(result).toEqual({
      fullName: 'Updated Name',
      email: 'user@test.com',
      contactInfo: '555-0100',
      preferences: 'email notifications',
    })
  })

  it('persists the change so a later read sees it', async () => {
    await updateProfile(1, validUpdate)
    expect((await getProfile(1)).fullName).toBe('Updated Name')
  })

  it('never changes the email', async () => {
    const result = await updateProfile(1, { ...validUpdate, email: 'hacker@test.com' })
    expect(result.email).toBe('user@test.com')
  })

  it('trims text fields', async () => {
    const result = await updateProfile(1, { ...validUpdate, fullName: '  Spaced Name  ' })
    expect(result.fullName).toBe('Spaced Name')
  })

  it('clears optional fields when they are omitted', async () => {
    await updateProfile(1, validUpdate)
    const result = await updateProfile(1, { fullName: 'Only Name' })
    expect(result.contactInfo).toBeNull()
    expect(result.preferences).toBeNull()
  })

  it('rejects a missing full name', async () => {
    try {
      await updateProfile(1, { contactInfo: '555-0100' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.fullName).toBeTruthy()
    }
  })

  it('rejects a full name over the 50 character limit', async () => {
    try {
      await updateProfile(1, { fullName: 'x'.repeat(51) })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).status).toBe(400)
    }
  })

  it('rejects contact info that is not text', async () => {
    try {
      await updateProfile(1, { fullName: 'Valid Name', contactInfo: 12345 })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.contactInfo).toBe('Contact info must be text.')
    }
  })

  it('throws 404 when the user has no profile', async () => {
    try {
      await updateProfile(9999, validUpdate)
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).status).toBe(404)
    }
  })
})
