import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { resetStore } from '../src/store/memoryStore'
import { adminToken, bearer } from './helpers'

// Integration tests - these cover the controller, router and error handler
// wiring that the pure unit tests deliberately skip.
const app = createApp()

beforeEach(() => {
  resetStore()
})

describe('GET /api/health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})

describe('GET /api/services', () => {
  it('returns the seeded services', async () => {
    const res = await request(app).get('/api/services')
    expect(res.status).toBe(200)
    expect(res.body.services).toHaveLength(3)
    expect(res.body.services[0]).toMatchObject({
      id: 1,
      name: 'Academic Advising',
      duration: 20,
      priority: 'medium',
      status: 'open',
    })
  })
})

describe('GET /api/services/:id', () => {
  it('returns a single service', async () => {
    const res = await request(app).get('/api/services/2')
    expect(res.status).toBe(200)
    expect(res.body.service.name).toBe('Financial Aid')
  })

  it('404s for an unknown id', async () => {
    const res = await request(app).get('/api/services/999')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('400s for a non-numeric id', async () => {
    const res = await request(app).get('/api/services/abc')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })
})

// POST is admin only, so every request here carries an admin token. The guard
// itself (401/403) is covered in auth.routes.test.ts.
describe('POST /api/services', () => {
  const valid = {
    name: 'Career Services',
    description: 'Resume reviews and interview preparation.',
    duration: 25,
    priority: 'medium',
  }

  function postService(body: object) {
    return request(app).post('/api/services').set('Authorization', bearer(adminToken())).send(body)
  }

  it('creates a service and returns 201', async () => {
    const res = await postService(valid)
    expect(res.status).toBe(201)
    expect(res.body.service).toMatchObject({ name: 'Career Services', status: 'open' })

    const list = await request(app).get('/api/services')
    expect(list.body.services).toHaveLength(4)
  })

  it('400s with per-field messages when the body is empty', async () => {
    const res = await postService({})
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(Object.keys(res.body.error.fields).sort()).toEqual([
      'description',
      'duration',
      'name',
      'priority',
    ])
  })

  it('409s on a duplicate service name', async () => {
    await postService(valid)
    const res = await postService(valid)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })

  it('400s on malformed JSON', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', bearer(adminToken()))
      .set('Content-Type', 'application/json')
      .send('{ not json')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_JSON')
  })
})

describe('unmatched routes', () => {
  it('404s with the shared error shape', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' })
  })
})
