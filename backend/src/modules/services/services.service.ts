import { ApiError } from '../../errors'
import { nextId, store, type Service } from '../../store/memoryStore'
import { validateOrThrow, type Schema } from '../../validation/validators'

// Service Management module for A3.
// This file holds the service rules, validation schemas, and plain store logic.
// Controllers call these functions, and tests can call the API without touching
// Express internals.

export const PRIORITY_LEVELS = ['low', 'medium', 'high'] as const
export const SERVICE_STATUSES = ['open', 'closed'] as const

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
  priority: (typeof PRIORITY_LEVELS)[number]
}

export interface ServiceStatusInput {
  status: (typeof SERVICE_STATUSES)[number]
}

export function listServices(): Service[] {
  return [...store.services]
}

export function getServiceById(id: number): Service {
  const service = store.services.find((s) => s.id === id)
  if (!service) throw ApiError.notFound(`No service with id ${id}.`)
  return service
}

function ensureUniqueServiceName(name: string, currentId?: number): void {
  const duplicate = store.services.some(
    (s) => s.id !== currentId && s.name.toLowerCase() === name.toLowerCase()
  )

  if (duplicate) {
    throw ApiError.conflict(`A service named "${name}" already exists.`)
  }
}

export function createService(input: unknown): Service {
  validateOrThrow(input, serviceInputSchema)
  const data = input as NewServiceInput
  const name = data.name.trim()

  ensureUniqueServiceName(name)

  const service: Service = {
    id: nextId('services'),
    name,
    description: data.description.trim(),
    duration: data.duration,
    priority: data.priority,
    status: 'open',
  }

  store.services.push(service)
  return service
}

export function updateService(id: number, input: unknown): Service {
  validateOrThrow(input, serviceInputSchema)
  const data = input as NewServiceInput
  const existing = getServiceById(id)
  const name = data.name.trim()

  ensureUniqueServiceName(name, id)

  existing.name = name
  existing.description = data.description.trim()
  existing.duration = data.duration
  existing.priority = data.priority

  return existing
}

export function updateServiceStatus(id: number, input: unknown): Service {
  validateOrThrow(input, serviceStatusSchema)
  const data = input as ServiceStatusInput
  const existing = getServiceById(id)

  existing.status = data.status
  return existing
}
