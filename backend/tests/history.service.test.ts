import { beforeEach, describe, expect, it } from 'vitest'
import { getUserHistory, recordHistory } from '../src/modules/history/history.service'
import { resetStore, store } from '../src/store/memoryStore'

beforeEach(() => {
  resetStore()
})

describe('getUserHistory', () => {
  it('returns the seeded records for the demo student', () => {
    const history = getUserHistory(1)
    expect(history).toHaveLength(3)
  })

  it('only returns the given user’s records', () => {
    // The admin (id 2) has no seeded history.
    expect(getUserHistory(2)).toHaveLength(0)
  })

  it('returns an empty array for an unknown user', () => {
    expect(getUserHistory(999)).toEqual([])
  })

  it('orders records most recent first', () => {
    const history = getUserHistory(1)
    for (let i = 1; i < history.length; i++) {
      expect(history[i - 1].endedAt).toBeGreaterThanOrEqual(history[i].endedAt)
    }
  })

  it('does not expose another user’s records after a new one is added', () => {
    recordHistory({
      userId: 2,
      serviceId: 1,
      serviceName: 'Academic Advising',
      joinedAt: Date.now() - 60000,
      outcome: 'served',
    })
    expect(getUserHistory(1)).toHaveLength(3)
    expect(getUserHistory(2)).toHaveLength(1)
  })
})

describe('recordHistory', () => {
  const base = {
    userId: 1,
    serviceId: 1,
    serviceName: 'Academic Advising',
    joinedAt: Date.now() - 15 * 60000,
  }

  it('appends a record and returns it with an id', () => {
    const record = recordHistory({ ...base, outcome: 'served' })
    expect(record.id).toBeGreaterThan(0)
    expect(store.history).toHaveLength(4)
  })

  it('makes the new record visible through getUserHistory', () => {
    recordHistory({ ...base, outcome: 'served' })
    expect(getUserHistory(1)).toHaveLength(4)
  })

  it('derives wait minutes from joinedAt and endedAt', () => {
    const joinedAt = 1_000_000
    const endedAt = joinedAt + 20 * 60000
    const record = recordHistory({ ...base, joinedAt, endedAt, outcome: 'served' })
    expect(record.waitMinutes).toBe(20)
  })

  it('rounds wait minutes to the nearest minute', () => {
    const joinedAt = 0
    const endedAt = joinedAt + 90 * 1000 // 1.5 minutes
    const record = recordHistory({ ...base, joinedAt, endedAt, outcome: 'left' })
    expect(record.waitMinutes).toBe(2)
  })

  it('never produces a negative wait time', () => {
    const joinedAt = Date.now()
    const endedAt = joinedAt - 5 * 60000 // ended before it joined (clock skew)
    const record = recordHistory({ ...base, joinedAt, endedAt, outcome: 'served' })
    expect(record.waitMinutes).toBe(0)
  })

  it('defaults endedAt to now when not given', () => {
    const before = Date.now()
    const record = recordHistory({ ...base, outcome: 'served' })
    expect(record.endedAt).toBeGreaterThanOrEqual(before)
  })

  it('preserves the outcome', () => {
    expect(recordHistory({ ...base, outcome: 'left' }).outcome).toBe('left')
    expect(recordHistory({ ...base, outcome: 'served' }).outcome).toBe('served')
  })

  it('keeps the denormalised service name even if the service is gone', () => {
    store.services = []
    const record = recordHistory({ ...base, outcome: 'served' })
    expect(record.serviceName).toBe('Academic Advising')
  })
})
