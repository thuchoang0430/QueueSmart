import { ApiError } from '../../errors'
import { prisma } from '../../db'
import { validateOrThrow, type Schema } from '../../validation/validators'

// A4 Service Management database integration.
// Service records live in PostgreSQL through Prisma. Queue status is stored in
// the related Queue row, so service status is mapped from the latest queue.

export const PRIORITY_LEVELS = ['low', 'medium', 'high'] as const
export const SERVICE_STATUSES = ['open', 'closed'] as const

export type Priority = (typeof PRIORITY_LEVELS)[number]
export type ServiceStatus = (typeof SERVICE_STATUSES)[number]

export interface ServiceDto {
  id: number
  name: string
  description: string
  duration: number
  priority: Priority
  status: ServiceStatus
}

export const serviceInputSchema: Schema = {
  name: { required: true, type: 'string', minLength: 2, maxLength: 100, label: 'Service name' },
  description: {
    required: true,
    type: 'string',
    minLength: 5,
    maxLength: 200,
    label: 'Description',
  },
  duration: { required: true, type: 'number', min: 1, max: 240, label: 'Expected duration' },
  priority: { required: true, type: 'string', oneOf: PRIORITY_LEVELS, label: 'Priority level' },
}

export const serviceStatusSchema: Schema = {
  status: { required: true, type: 'string', oneOf: SERVICE_STATUSES, label: 'Service status' },
}

export interface NewServiceInput {
  name: string
  description: string
  duration: number
  priority: Priority
}

export interface ServiceStatusInput {
  status: ServiceStatus
}

interface QueueStatusRecord {
  status: 'OPEN' | 'CLOSED'
}

interface ServiceRecord {
  id: number
  name: string
  description: string
  expectedDuration: number
  priorityLevel: number
  queues: QueueStatusRecord[]
}

const serviceWithLatestQueue = {
  queues: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: { status: true },
  },
}

function priorityToLevel(priority: Priority): number {
  return PRIORITY_LEVELS.indexOf(priority) + 1
}

function priorityFromLevel(level: number): Priority {
  if (level === 1) return 'low'
  if (level === 3) return 'high'
  return 'medium'
}

function statusToQueueStatus(status: ServiceStatus): 'OPEN' | 'CLOSED' {
  return status === 'open' ? 'OPEN' : 'CLOSED'
}

function statusFromQueue(queue?: QueueStatusRecord): ServiceStatus {
  return queue?.status === 'CLOSED' ? 'closed' : 'open'
}

function toServiceDto(service: ServiceRecord): ServiceDto {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    duration: service.expectedDuration,
    priority: priorityFromLevel(service.priorityLevel),
    status: statusFromQueue(service.queues[0]),
  }
}

async function ensureUniqueServiceName(name: string, currentId?: number): Promise<void> {
  const services = await prisma.service.findMany({
    select: { id: true, name: true },
  })

  const duplicate = services.some(
    (service) => service.id !== currentId && service.name.toLowerCase() === name.toLowerCase()
  )

  if (duplicate) {
    throw ApiError.conflict(`A service named "${name}" already exists.`)
  }
}

export async function listServices(): Promise<ServiceDto[]> {
  const services = await prisma.service.findMany({
    orderBy: { id: 'asc' },
    include: serviceWithLatestQueue,
  })

  return services.map(toServiceDto)
}

export async function getServiceById(id: number): Promise<ServiceDto> {
  const service = await prisma.service.findUnique({
    where: { id },
    include: serviceWithLatestQueue,
  })

  if (!service) throw ApiError.notFound(`No service with id ${id}.`)
  return toServiceDto(service)
}

export async function createService(input: unknown): Promise<ServiceDto> {
  validateOrThrow(input, serviceInputSchema)
  const data = input as NewServiceInput
  const name = data.name.trim()

  await ensureUniqueServiceName(name)

  const service = await prisma.service.create({
    data: {
      name,
      description: data.description.trim(),
      expectedDuration: data.duration,
      priorityLevel: priorityToLevel(data.priority),
      queues: {
        create: { status: 'OPEN' },
      },
    },
    include: serviceWithLatestQueue,
  })

  return toServiceDto(service)
}

export async function updateService(id: number, input: unknown): Promise<ServiceDto> {
  validateOrThrow(input, serviceInputSchema)
  const data = input as NewServiceInput
  const name = data.name.trim()

  await getServiceById(id)
  await ensureUniqueServiceName(name, id)

  const service = await prisma.service.update({
    where: { id },
    data: {
      name,
      description: data.description.trim(),
      expectedDuration: data.duration,
      priorityLevel: priorityToLevel(data.priority),
    },
    include: serviceWithLatestQueue,
  })

  return toServiceDto(service)
}

export async function updateServiceStatus(id: number, input: unknown): Promise<ServiceDto> {
  validateOrThrow(input, serviceStatusSchema)
  const data = input as ServiceStatusInput

  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      queues: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true },
      },
    },
  })

  if (!service) throw ApiError.notFound(`No service with id ${id}.`)

  const queueStatus = statusToQueueStatus(data.status)
  const currentQueue = service.queues[0]

  if (currentQueue) {
    await prisma.queue.update({
      where: { id: currentQueue.id },
      data: { status: queueStatus },
    })
  } else {
    await prisma.queue.create({
      data: { serviceId: id, status: queueStatus },
    })
  }

  return getServiceById(id)
}

export async function deleteService(id: number): Promise<ServiceDto> {
  const service = await getServiceById(id)

  await prisma.$transaction(async (tx) => {
    await tx.queueEntry.deleteMany({
      where: { queue: { serviceId: id } },
    })
    await tx.queue.deleteMany({ where: { serviceId: id } })
    await tx.service.delete({ where: { id } })
  })

  return service
}
