import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { recordHistory, type HistoryOutcome } from '../src/modules/history/history.service'
import { adminToken, bearer, userToken } from './helpers'
import { disconnectDb, resetUsers } from './db'

const app = createApp()

async function addVisit(visit: {
  serviceId: number
  serviceName?: string
  waitMinutes: number
  outcome: HistoryOutcome
  endedAt?: number
  userId?: number
}): Promise<void> {
  const endedAt = visit.endedAt ?? Date.now()
  await recordHistory({
    userId: visit.userId ?? 1,
    serviceId: visit.serviceId,
    serviceName: visit.serviceName ?? `Service ${visit.serviceId}`,
    joinedAt: endedAt - visit.waitMinutes * 60000,
    endedAt,
    outcome: visit.outcome,
  })
}

beforeEach(async () => {
  await resetUsers()
})

afterAll(async () => {
  await disconnectDb()
})

describe('GET /api/reports - access control', () => {
  it('returns 401 without a token', async () => {
    const response = await request(app).get('/api/reports')
    expect(response.status).toBe(401)
  })

  it('returns 401 for an unknown token', async () => {
    const response = await request(app).get('/api/reports').set('Authorization', bearer('session-fake'))
    expect(response.status).toBe(401)
  })

  it('returns 403 for a signed-in non-admin user', async () => {
    const response = await request(app).get('/api/reports').set('Authorization', bearer(userToken()))
    expect(response.status).toBe(403)
  })

  it('returns 200 for an admin', async () => {
    const response = await request(app).get('/api/reports').set('Authorization', bearer(adminToken()))
    expect(response.status).toBe(200)
  })
})

describe('GET /api/reports - payload', () => {
  it('returns the aggregated report in the frontend contract shape', async () => {
    await addVisit({ serviceId: 1, serviceName: 'Academic Advising', waitMinutes: 18, outcome: 'served' })
    await addVisit({ serviceId: 2, serviceName: 'Financial Aid', waitMinutes: 10, outcome: 'left' })
    await addVisit({ serviceId: 1, serviceName: 'Academic Advising', waitMinutes: 12, outcome: 'served' })

    const response = await request(app).get('/api/reports').set('Authorization', bearer(adminToken()))

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      totalServed: 2,
      averageWaitTime: 15, // (18 + 12) / 2
      queueActivity: 3,
      serviceStatistics: [
        { serviceId: 1, serviceName: 'Academic Advising', totalServed: 2, averageWaitTime: 15, queueActivity: 2 },
        { serviceId: 2, serviceName: 'Financial Aid', totalServed: 0, averageWaitTime: 0, queueActivity: 1 },
      ],
    })
  })

  it('reports zeros for an empty history', async () => {
    const response = await request(app).get('/api/reports').set('Authorization', bearer(adminToken()))
    expect(response.body).toEqual({
      totalServed: 0,
      averageWaitTime: 0,
      queueActivity: 0,
      serviceStatistics: [],
    })
  })
})

describe('GET /api/reports - filtering', () => {
  beforeEach(async () => {
    await addVisit({ serviceId: 1, waitMinutes: 10, outcome: 'served', endedAt: 1_000_000 })
    await addVisit({ serviceId: 1, waitMinutes: 20, outcome: 'served', endedAt: 2_000_000 })
    await addVisit({ serviceId: 2, waitMinutes: 5, outcome: 'left', endedAt: 3_000_000 })
  })

  it('narrows to a single service with ?serviceId', async () => {
    const response = await request(app)
      .get('/api/reports?serviceId=1')
      .set('Authorization', bearer(adminToken()))

    expect(response.status).toBe(200)
    expect(response.body.queueActivity).toBe(2)
    expect(response.body.serviceStatistics.map((row: { serviceId: number }) => row.serviceId)).toEqual([1])
  })

  it('applies an inclusive date range from the whole named day', async () => {
    // A visit that ended on 2026-08-13; a from/to on that day must include it.
    const endedAt = new Date('2026-08-13T09:30:00.000').getTime()
    await addVisit({ serviceId: 5, waitMinutes: 7, outcome: 'served', endedAt })

    const response = await request(app)
      .get('/api/reports?serviceId=5&from=2026-08-13&to=2026-08-13')
      .set('Authorization', bearer(adminToken()))

    expect(response.status).toBe(200)
    expect(response.body.queueActivity).toBe(1)
    expect(response.body.totalServed).toBe(1)
  })

  it('returns 400 for a non-numeric serviceId', async () => {
    const response = await request(app)
      .get('/api/reports?serviceId=abc')
      .set('Authorization', bearer(adminToken()))

    expect(response.status).toBe(400)
    expect(response.body.error.fields).toHaveProperty('serviceId')
  })

  it('returns 400 for a malformed date', async () => {
    const response = await request(app)
      .get('/api/reports?from=13-08-2026')
      .set('Authorization', bearer(adminToken()))

    expect(response.status).toBe(400)
    expect(response.body.error.fields).toHaveProperty('from')
  })
})
