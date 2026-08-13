import { beforeEach, describe, expect, it } from 'vitest'
import { generateReport } from '../src/modules/reports/reports.service'
import { recordHistory } from '../src/modules/history/history.service'
import { resetStore, store } from '../src/store/memoryStore'

// The seeded history (see memoryStore.seedHistory) is three visits for user 1:
//   service 1  Academic Advising  18 min  served
//   service 2  Financial Aid      10 min  left
//   service 3  IT Help Desk       12 min  served
// Every expectation below is anchored to that fixture.

beforeEach(() => {
  resetStore()
})

describe('generateReport - totals', () => {
  it('counts only served visits in totalServed', () => {
    // Two of the three seeded visits ended in 'served'.
    expect(generateReport().totalServed).toBe(2)
  })

  it('averages wait time over served visits only, ignoring the left one', () => {
    // (18 + 12) / 2 = 15; the 10-minute 'left' visit is excluded.
    expect(generateReport().averageWaitTime).toBe(15)
  })

  it('counts every participation (served + left) in queueActivity', () => {
    expect(generateReport().queueActivity).toBe(3)
  })

  it('reports zero averageWaitTime when no visit was served', () => {
    store.history = store.history.filter((record) => record.outcome !== 'served')
    const report = generateReport()
    expect(report.totalServed).toBe(0)
    expect(report.averageWaitTime).toBe(0)
  })

  it('reports all-zero totals for an empty history', () => {
    store.history = []
    expect(generateReport()).toEqual({
      totalServed: 0,
      averageWaitTime: 0,
      queueActivity: 0,
      serviceStatistics: [],
    })
  })
})

describe('generateReport - serviceStatistics', () => {
  it('produces one row per service present in the history', () => {
    const { serviceStatistics } = generateReport()
    expect(serviceStatistics.map((row) => row.serviceId)).toEqual([1, 2, 3])
  })

  it('orders rows by serviceId', () => {
    const ids = generateReport().serviceStatistics.map((row) => row.serviceId)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))
  })

  it('breaks the totals down correctly per service', () => {
    const rows = generateReport().serviceStatistics
    expect(rows).toEqual([
      { serviceId: 1, serviceName: 'Academic Advising', totalServed: 1, averageWaitTime: 18, queueActivity: 1 },
      { serviceId: 2, serviceName: 'Financial Aid', totalServed: 0, averageWaitTime: 0, queueActivity: 1 },
      { serviceId: 3, serviceName: 'IT Help Desk', totalServed: 1, averageWaitTime: 12, queueActivity: 1 },
    ])
  })

  it('aggregates multiple visits to the same service and rounds the average to 1dp', () => {
    // Add two more served visits to service 1: 11 and 20 minutes.
    // Service 1 now has 18, 11, 20 served -> mean 16.333... -> 16.3.
    const joinedAt = 1_000_000
    recordHistory({ userId: 2, serviceId: 1, serviceName: 'Academic Advising', joinedAt, endedAt: joinedAt + 11 * 60000, outcome: 'served' })
    recordHistory({ userId: 2, serviceId: 1, serviceName: 'Academic Advising', joinedAt, endedAt: joinedAt + 20 * 60000, outcome: 'served' })

    const serviceOne = generateReport().serviceStatistics.find((row) => row.serviceId === 1)!
    expect(serviceOne.totalServed).toBe(3)
    expect(serviceOne.queueActivity).toBe(3)
    expect(serviceOne.averageWaitTime).toBe(16.3)
  })

  it('still reports a service by name after it has been deleted', () => {
    // History is denormalised, so removing the service must not drop its stats.
    store.services = store.services.filter((service) => service.id !== 1)
    const serviceOne = generateReport().serviceStatistics.find((row) => row.serviceId === 1)!
    expect(serviceOne.serviceName).toBe('Academic Advising')
  })
})
