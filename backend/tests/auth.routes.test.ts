import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { resetStore } from '../src/store/memoryStore'
import { bearer, userToken } from './helpers'

const app = createApp()

beforeEach(() => {
  resetStore()
})

describe('POST /api/auth/register', () => {
  const validSignup = { name: 'Andy Do', email: 'andy@test.edu', password: 'password123' }

  it('creates an account and returns 201 with a token', async () => {
    const res = await request(app).post('/api/auth/register').send(validSignup)
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ email: 'andy@test.edu', role: 'user' })
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.password).toBeUndefined()
  })

  it('400s with per-field messages on an empty body', async () => {
    const res = await request(app).post('/api/auth/register').send({})
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(Object.keys(res.body.error.fields).sort()).toEqual(['email', 'name', 'password'])
  })

  it('409s on a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validSignup)
    const res = await request(app).post('/api/auth/register').send(validSignup)
    expect(res.status).toBe(409)
  })

  it('issues a token that immediately works', async () => {
    const signup = await request(app).post('/api/auth/register').send(validSignup)
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', bearer(signup.body.token))
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('andy@test.edu')
  })
})

describe('POST /api/auth/login', () => {
  it('signs in a seeded account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' })
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('admin')
  })

  it('401s on a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'nope' })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('400s when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com' })
    expect(res.status).toBe(400)
    expect(res.body.error.fields.password).toBeTruthy()
  })
})

describe('GET /api/auth/me', () => {
  it('returns the signed-in user', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', bearer(userToken()))
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('user@test.com')
  })

  it('401s without a token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401)
  })

  it('401s on an unknown token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', bearer('session-fake'))
    expect(res.status).toBe(401)
  })

  it('401s when the header is not a Bearer scheme', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', userToken())
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('invalidates the token', async () => {
    const token = userToken()
    expect((await request(app).post('/api/auth/logout').set('Authorization', bearer(token))).status)
      .toBe(204)

    const after = await request(app).get('/api/auth/me').set('Authorization', bearer(token))
    expect(after.status).toBe(401)
  })
})

describe('role guards on POST /api/services', () => {
  const newService = {
    name: 'Career Services',
    description: 'Resume reviews and interview preparation.',
    duration: 25,
    priority: 'medium',
  }

  it('401s when nobody is signed in', async () => {
    const res = await request(app).post('/api/services').send(newService)
    expect(res.status).toBe(401)
  })

  it('403s for a signed-in non-admin', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', bearer(userToken()))
      .send(newService)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('leaves GET /api/services public', async () => {
    expect((await request(app).get('/api/services')).status).toBe(200)
  })
})
