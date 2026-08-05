import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../src/errors'
import { prisma } from '../src/database/prisma'
import {
  createService,
  getServiceById,
  listServices,
} from '../src/modules/services/services.service'

async function resetServiceTables(): Promise<void> {
  await prisma.queueEntry.deleteMany()
  await prisma.queue.deleteMany()
  await prisma.service.deleteMany()

  const services = [
    {
      name: 'Academic Advising',
      description: 'General academic guidance and course planning for students.',
      expectedDuration: 20,
      priorityLevel: 2,
    },
    {
      name: 'Financial Aid',
      description: 'Assistance with financial aid applications and questions.',
      expectedDuration: 30,
      priorityLevel: 3,
    },
    {
      name: 'IT Help Desk',
      description: 'Technical support for accounts, devices, and campus wifi.',
      expectedDuration: 15,
      priorityLevel: 1,
    },
  ]

  for (const service of services) {
    await prisma.service.create({
      data: {
        ...service,
        queues: {
          create: {
            status: 'OPEN',
          },
        },
      },
    })
  }
}

beforeEach(async () => {
  await resetServiceTables()
})

describe('listServices', () => {
  it('returns the seeded services', async () => {
    const services = await listServices()

    expect(services).toHaveLength(3)
    expect(services[0]).toMatchObject({
      name: 'Academic Advising',
      duration: 20,
      priority: 'medium',
      status: 'open',
    })
  })

  it('returns an independent array', async () => {
    const services = await listServices()

    services.push({
      id: 999,
      name: 'Injected',
      description: 'Should not persist.',
      duration: 5,
      priority: 'low',
      status: 'open',
    })

    const databaseServices = await listServices()
    expect(databaseServices).toHaveLength(3)
  })
})

describe('getServiceById', () => {
  it('finds an existing service', async () => {
    const services = await listServices()
    const service = await getServiceById(services[0].id)

    expect(service.name).toBe('Academic Advising')
  })

  it('throws 404 for an unknown id', async () => {
    await expect(getServiceById(999999)).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })
})

describe('createService', () => {
  const valid = {
    name: 'Career Services',
    description: 'Resume reviews and interview preparation.',
    duration: 25,
    priority: 'medium' as const,
  }

  it('adds a database service with an open queue', async () => {
    const created = await createService(valid)

    expect(created.id).toEqual(expect.any(Number))
    expect(created.status).toBe('open')

    const count = await prisma.service.count()
    expect(count).toBe(4)

    const queue = await prisma.queue.findFirst({
      where: {
        serviceId: created.id,
      },
    })

    expect(queue?.status).toBe('OPEN')
  })

  it('trims surrounding whitespace', async () => {
    const created = await createService({
      ...valid,
      name: '  Career Services  ',
    })

    expect(created.name).toBe('Career Services')
  })

  it('rejects a duplicate name regardless of casing', async () => {
    await createService(valid)

    await expect(
      createService({
        ...valid,
        name: 'career services',
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    })

    expect(await prisma.service.count()).toBe(4)
  })

  it('rejects missing required fields', async () => {
    await expect(createService({})).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      fields: {
        name: 'Service name is required.',
        description: 'Description is required.',
        duration: 'Expected duration is required.',
        priority: 'Priority level is required.',
      },
    })
  })

  it('rejects a duration sent as a string', async () => {
    await expect(
      createService({
        ...valid,
        duration: '25',
      }),
    ).rejects.toMatchObject({
      fields: {
        duration: 'Expected duration must be a number.',
      },
    })
  })

  it('rejects duration outside the allowed range', async () => {
    await expect(
      createService({
        ...valid,
        duration: 0,
      }),
    ).rejects.toBeInstanceOf(ApiError)

    await expect(
      createService({
        ...valid,
        duration: 241,
      }),
    ).rejects.toBeInstanceOf(ApiError)
  })

  it('rejects a description over 200 characters', async () => {
    await expect(
      createService({
        ...valid,
        description: 'x'.repeat(201),
      }),
    ).rejects.toMatchObject({
      fields: {
        description: 'Description must be 200 characters or fewer.',
      },
    })
  })

  it('rejects an unknown priority level', async () => {
    await expect(
      createService({
        ...valid,
        priority: 'urgent',
      }),
    ).rejects.toMatchObject({
      fields: {
        priority: expect.stringContaining(
          'Priority level must be one of',
        ),
      },
    })
  })

  it('does not add a database record when validation fails', async () => {
    await expect(createService({})).rejects.toBeInstanceOf(ApiError)

    expect(await prisma.service.count()).toBe(3)
  })
})
