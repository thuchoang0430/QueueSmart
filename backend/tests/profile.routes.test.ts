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

describe('PUT /api/profile', () => {
  const validUpdate = {
    fullName: 'Updated Name',
    contactInfo: '555-0100',
    preferences: 'dark mode',
  }

  it('updates the profile and returns the new values', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', bearer(userToken()))
      .send(validUpdate)
    expect(res.status).toBe(200)
    expect(res.body.profile).toMatchObject(validUpdate)
  })

  it('persists across requests', async () => {
    await request(app).put('/api/profile').set('Authorization', bearer(userToken())).send(validUpdate)
    const res = await request(app).get('/api/profile').set('Authorization', bearer(userToken()))
    expect(res.body.profile.fullName).toBe('Updated Name')
  })

  it('400s with a field message on invalid input', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', bearer(userToken()))
      .send({ fullName: '' })
    expect(res.status).toBe(400)
    expect(res.body.error.fields.fullName).toBeTruthy()
  })

  it('401s without a token', async () => {
    expect((await request(app).put('/api/profile').send(validUpdate)).status).toBe(401)
  })
})
