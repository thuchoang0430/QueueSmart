import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { prisma } from '../src/db'
import { resetStore } from '../src/store/memoryStore'
import { adminToken, bearer } from './helpers'

const app = createApp()

async function resetServiceTables(): Promise<void> {
  await prisma.queueEntry.deleteMany()
  await prisma.queue.deleteMany()
  await prisma.service.deleteMany()

  await prisma.service.create({
    data: {
      name: 'Academic Advising',
      description: 'General academic guidance and course planning for students.',
      expectedDuration: 20,
      priorityLevel: 2,
      queues: { create: { status: 'OPEN' } },
    },
  })

  await prisma.service.create({
    data: {
      name: 'Financial Aid',
      description: 'Assistance with financial aid applications and questions.',
      expectedDuration: 30,
      priorityLevel: 3,
      queues: { create: { status: 'OPEN' } },
    },
  })

  await prisma.service.create({
    data: {
      name: 'IT Help Desk',
      description: 'Technical support for student accounts, devices, and campus wifi.',
      expectedDuration: 15,
      priorityLevel: 1,
      queues: { create: { status: 'OPEN' } },
    },
  })
}

describe('Service Management API', () => {
  let authorization: string

  beforeEach(async () => {
    resetStore()
    await resetServiceTables()
    authorization = bearer(adminToken())
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('lists the seeded services from the database', async () => {
    const res = await request(app).get('/api/services').expect(200)

    expect(res.body.services).toHaveLength(3)
    expect(res.body.services[0]).toMatchObject({
      name: 'Academic Advising',
      duration: 20,
      priority: 'medium',
      status: 'open',
    })
  })

  it('gets one service by id', async () => {
    const listRes = await request(app).get('/api/services').expect(200)
    const serviceId = listRes.body.services[0].id

    const res = await request(app).get(`/api/services/${serviceId}`).expect(200)

    expect(res.body.service).toMatchObject({
      id: serviceId,
      name: 'Academic Advising',
      status: 'open',
    })
  })

  it('creates a new service with a database queue', async () => {
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
      name: 'Career Services',
      description: 'Resume, interview, and career support for students.',
      duration: 25,
      priority: 'medium',
      status: 'open',
    })

    const createdQueue = await prisma.queue.findFirst({
      where: { serviceId: res.body.service.id },
    })

    expect(createdQueue?.status).toBe('OPEN')
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

  it('updates an existing service in the database', async () => {
    const listRes = await request(app).get('/api/services').expect(200)
    const serviceId = listRes.body.services[0].id

    const res = await request(app)
      .put(`/api/services/${serviceId}`)
      .set('Authorization', authorization)
      .send({
        name: 'Updated Advising',
        description: 'Updated academic advising description.',
        duration: 35,
        priority: 'high',
      })
      .expect(200)

    expect(res.body.service).toMatchObject({
      id: serviceId,
      name: 'Updated Advising',
      description: 'Updated academic advising description.',
      duration: 35,
      priority: 'high',
      status: 'open',
    })

    const saved = await prisma.service.findUnique({ where: { id: serviceId } })
    expect(saved?.expectedDuration).toBe(35)
    expect(saved?.priorityLevel).toBe(3)
  })

  it('returns 404 when updating a service that does not exist', async () => {
    const res = await request(app)
      .put('/api/services/999999')
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

  it('opens and closes a service queue status in the database', async () => {
    const listRes = await request(app).get('/api/services').expect(200)
    const serviceId = listRes.body.services[0].id

    const closeRes = await request(app)
      .patch(`/api/services/${serviceId}/status`)
      .set('Authorization', authorization)
      .send({ status: 'closed' })
      .expect(200)

    expect(closeRes.body.service.status).toBe('closed')

    const closedQueue = await prisma.queue.findFirst({ where: { serviceId } })
    expect(closedQueue?.status).toBe('CLOSED')

    const openRes = await request(app)
      .patch(`/api/services/${serviceId}/status`)
      .set('Authorization', authorization)
      .send({ status: 'open' })
      .expect(200)

    expect(openRes.body.service.status).toBe('open')
  })

  it('rejects invalid service status values', async () => {
    const listRes = await request(app).get('/api/services').expect(200)
    const serviceId = listRes.body.services[0].id

    const res = await request(app)
      .patch(`/api/services/${serviceId}/status`)
      .set('Authorization', authorization)
      .send({ status: 'paused' })
      .expect(400)

    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.fields.status).toBe(
      'Service status must be one of: open, closed.'
    )
  })

  it('deletes a service and its related queue', async () => {
    const listRes = await request(app).get('/api/services').expect(200)
    const serviceId = listRes.body.services[0].id

    const res = await request(app)
      .delete(`/api/services/${serviceId}`)
      .set('Authorization', authorization)
      .expect(200)

    expect(res.body.service.id).toBe(serviceId)

    const deletedService = await prisma.service.findUnique({ where: { id: serviceId } })
    const deletedQueue = await prisma.queue.findFirst({ where: { serviceId } })

    expect(deletedService).toBeNull()
    expect(deletedQueue).toBeNull()
  })
})
