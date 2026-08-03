import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '../src/errors'
import { resetStore, store } from '../src/store/memoryStore'
import {
  createService,
  getServiceById,
  listServices,
} from '../src/modules/services/services.service'

// Unit tests for the service layer - no HTTP involved. This is the pattern to
// copy for auth, queue, wait-time, notifications and history.
beforeEach(() => {
  resetStore()
})

describe('listServices', () => {
  it('returns the seeded services', () => {
    expect(listServices()).toHaveLength(3)
  })

  it('returns a copy so callers cannot mutate the store directly', () => {
    listServices().push({
      id: 99,
      name: 'Injected',
      description: 'should not persist',
      duration: 5,
      priority: 'low',
      status: 'open',
    })
    expect(store.services).toHaveLength(3)
  })
})

describe('getServiceById', () => {
  it('finds an existing service', () => {
    expect(getServiceById(1).name).toBe('Academic Advising')
  })

  it('throws 404 for an unknown id', () => {
    try {
      getServiceById(999)
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).status).toBe(404)
    }
  })
})

describe('createService', () => {
  const valid = {
    name: 'Career Services',
    description: 'Resume reviews and interview preparation.',
    duration: 25,
    priority: 'medium' as const,
  }

  it('adds a service and returns it with an id and open status', () => {
    const created = createService(valid)
    expect(created.id).toBe(4)
    expect(created.status).toBe('open')
    expect(store.services).toHaveLength(4)
  })

  it('trims surrounding whitespace', () => {
    const created = createService({ ...valid, name: '  Career Services  ' })
    expect(created.name).toBe('Career Services')
  })

  it('rejects a duplicate name regardless of casing', () => {
    createService(valid)
    try {
      createService({ ...valid, name: 'career services' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).status).toBe(409)
    }
    expect(store.services).toHaveLength(4)
  })

  it('rejects missing required fields', () => {
    try {
      createService({})
      expect.unreachable('should have thrown')
    } catch (err) {
      const fields = (err as ApiError).fields ?? {}
      expect(Object.keys(fields).sort()).toEqual(['description', 'duration', 'name', 'priority'])
    }
  })

  it('rejects a duration sent as a string', () => {
    try {
      createService({ ...valid, duration: '25' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.duration).toBe('Expected duration must be a number.')
    }
  })

  it('rejects a duration outside the allowed range', () => {
    expect(() => createService({ ...valid, duration: 0 })).toThrow(ApiError)
    expect(() => createService({ ...valid, duration: 241 })).toThrow(ApiError)
  })

  it('rejects a description over the 200 character limit', () => {
    try {
      createService({ ...valid, description: 'x'.repeat(201) })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.description).toBe(
        'Description must be 200 characters or fewer.'
      )
    }
  })

  it('rejects an unknown priority level', () => {
    try {
      createService({ ...valid, priority: 'urgent' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as ApiError).fields?.priority).toContain('Priority level must be one of')
    }
  })

  it('does not add anything to the store when validation fails', () => {
    expect(() => createService({})).toThrow(ApiError)
    expect(store.services).toHaveLength(3)
  })
})

describe('resetStore', () => {
  it('undoes changes made by a previous test', () => {
    createService({
      name: 'Temporary',
      description: 'Added inside this test only.',
      duration: 10,
      priority: 'low',
    })
    expect(store.services).toHaveLength(4)

    resetStore()
    expect(store.services).toHaveLength(3)
    expect(store.queueEntries).toHaveLength(0)
  })
})
