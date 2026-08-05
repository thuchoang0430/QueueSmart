import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { clearSessions } from '../src/modules/auth/auth.service'
import { disconnectDb, resetUsers } from './db'
import { bearer, userToken } from './helpers'

const app = createApp()

beforeEach(async () => {
  clearSessions()
  await resetUsers()
})

afterAll(disconnectDb)

describe('GET /api/profile', () => {
  it('returns the signed-in user profile', async () => {
    const res = await request(app).get('/api/profile').set('Authorization', bearer(userToken()))
    expect(res.status).toBe(200)
    expect(res.body.profile).toEqual({
      fullName: 'Student User',
      email: 'user@test.com',
      contactInfo: null,
      preferences: null,
    })
  })

  it('401s without a token', async () => {
    expect((await request(app).get('/api/profile')).status).toBe(401)
  })

  it('401s on an unknown token', async () => {
    const res = await request(app).get('/api/profile').set('Authorization', bearer('session-fake'))
    expect(res.status).toBe(401)
  })
})
