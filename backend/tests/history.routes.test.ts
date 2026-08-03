import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { resetStore } from '../src/store/memoryStore'
import { adminToken, bearer, userToken } from './helpers'

const app = createApp()

beforeEach(() => {
  resetStore()
})

describe('GET /api/history', () => {
  it('returns the signed-in user’s history', async () => {
    const res = await request(app).get('/api/history').set('Authorization', bearer(userToken()))
    expect(res.status).toBe(200)
    expect(res.body.history).toHaveLength(3)
    expect(res.body.history[0]).toHaveProperty('serviceName')
    expect(res.body.history[0]).toHaveProperty('outcome')
  })

  it('returns an empty list for a user with no history', async () => {
    // The seeded admin has no history records.
    const res = await request(app).get('/api/history').set('Authorization', bearer(adminToken()))
    expect(res.status).toBe(200)
    expect(res.body.history).toEqual([])
  })

  it('401s without a token', async () => {
    expect((await request(app).get('/api/history')).status).toBe(401)
  })

  it('401s on an unknown token', async () => {
    const res = await request(app).get('/api/history').set('Authorization', bearer('session-fake'))
    expect(res.status).toBe(401)
  })

  it('returns records most recent first', async () => {
    const res = await request(app).get('/api/history').set('Authorization', bearer(userToken()))
    const { history } = res.body
    for (let i = 1; i < history.length; i++) {
      expect(history[i - 1].endedAt).toBeGreaterThanOrEqual(history[i].endedAt)
    }
  })
})
