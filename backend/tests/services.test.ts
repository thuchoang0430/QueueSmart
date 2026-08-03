import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { resetStore } from '../src/store/memoryStore'
import { adminToken, bearer } from './helpers'

const app = createApp()

describe('Service Management API', () => {
  let authorization: string

  beforeEach(() => {
    resetStore()
    authorization = bearer(adminToken())
  })

  it('lists the seeded services', async () => {
    const res = await request(app).get('/api/services').expect(200)

    expect(res.body.services).toHaveLength(3)
    expect(res.body.services[0]).toMatchObject({
      id: 1,
      name: 'Academic Advising',
      status: 'open',
    })
  })

  it('creates a new service with valid input', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', authorization)
      .send({
        name: 'Career Services',
        description: 'Resume, interview, and career support for students.',
        duration: 25,
        priority: 'medium',
      })
      .expect(201)

    expect(res.body.service).toMatchObject({
      id: 4,
      name: 'Career Services',
      description: 'Resume, interview, and career support for students.',
      duration: 25,
      priority: 'medium',
      status: 'open',
    })
  })

  it('rejects create service requests with missing required fields', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', authorization)
      .send({})
      .expect(400)

    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.fields).toMatchObject({
      name: 'Service name is required.',
      description: 'Description is required.',
      duration: 'Expected duration is required.',
      priority: 'Priority level is required.',
    })
  })

  it('rejects invalid duration and priority values', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', authorization)
      .send({
        name: 'Bad Service',
        description: 'This request has bad values.',
        duration: 0,
        priority: 'urgent',
      })
      .expect(400)

    expect(res.body.error.fields.duration).toBe(
      'Expected duration must be at least 1.'
    )
    expect(res.body.error.fields.priority).toBe(
      'Priority level must be one of: low, medium, high.'
    )
  })

  it('rejects duplicate service names', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', authorization)
      .send({
        name: 'Academic Advising',
        description: 'Duplicate service name should not be accepted.',
        duration: 20,
        priority: 'low',
      })
      .expect(409)

    expect(res.body.error.code).toBe('CONFLICT')
  })

  it('updates an existing service', async () => {
    const res = await request(app)
      .put('/api/services/1')
      .set('Authorization', authorization)
      .send({
        name: 'Updated Advising',
        description: 'Updated academic advising description.',
        duration: 35,
        priority: 'high',
      })
      .expect(200)

    expect(res.body.service).toMatchObject({
      id: 1,
      name: 'Updated Advising',
      description: 'Updated academic advising description.',
      duration: 35,
      priority: 'high',
      status: 'open',
    })
  })

  it('returns 404 when updating a service that does not exist', async () => {
    const res = await request(app)
      .put('/api/services/999')
      .set('Authorization', authorization)
      .send({
        name: 'Missing Service',
        description: 'This service does not exist.',
        duration: 15,
        priority: 'low',
      })
      .expect(404)

    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('opens and closes a service status', async () => {
    const closeRes = await request(app)
      .patch('/api/services/1/status')
      .set('Authorization', authorization)
      .send({ status: 'closed' })
      .expect(200)

    expect(closeRes.body.service.status).toBe('closed')

    const openRes = await request(app)
      .patch('/api/services/1/status')
      .set('Authorization', authorization)
      .send({ status: 'open' })
      .expect(200)

    expect(openRes.body.service.status).toBe('open')
  })

  it('rejects invalid service status values', async () => {
    const res = await request(app)
      .patch('/api/services/1/status')
      .set('Authorization', authorization)
      .send({ status: 'paused' })
      .expect(400)

    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.fields.status).toBe(
      'Service status must be one of: open, closed.'
    )
  })
})
