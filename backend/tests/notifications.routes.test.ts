import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { resetStore } from '../src/store/memoryStore'
import { adminToken, bearer, userToken } from './helpers'

const app = createApp()

beforeEach(() => {
  resetStore()
})

describe('GET /api/notifications', () => {
  it('returns the signed-in user’s notifications and unread count', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', bearer(userToken()))
    expect(res.status).toBe(200)
    expect(res.body.notifications).toHaveLength(2)
    expect(res.body.unreadCount).toBe(1)
  })

  it('returns an empty list for a user with no notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', bearer(adminToken()))
    expect(res.status).toBe(200)
    expect(res.body.notifications).toEqual([])
    expect(res.body.unreadCount).toBe(0)
  })

  it('401s without a token', async () => {
    expect((await request(app).get('/api/notifications')).status).toBe(401)
  })
})

describe('POST /api/notifications/read', () => {
  it('marks all of the user’s notifications read', async () => {
    const token = userToken()

    const markRes = await request(app)
      .post('/api/notifications/read')
      .set('Authorization', bearer(token))
    expect(markRes.status).toBe(200)
    expect(markRes.body.updated).toBe(1)

    const after = await request(app).get('/api/notifications').set('Authorization', bearer(token))
    expect(after.body.unreadCount).toBe(0)
  })

  it('401s without a token', async () => {
    expect((await request(app).post('/api/notifications/read')).status).toBe(401)
  })
})
