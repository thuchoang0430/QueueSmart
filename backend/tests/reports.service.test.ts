import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { generateReport, parseReportFilter } from '../src/modules/reports/reports.service'
import { recordHistory, type HistoryOutcome } from '../src/modules/history/history.service'
import { disconnectDb, resetUsers } from './db'

// These aggregate over the persisted History table, so they are DB-backed like
// the history/auth suites. resetUsers() truncates History (via CASCADE) and
// reseeds users 1 and 2, so every test starts from an empty history it fills
// itself - no shared fixture to reason about.

interface Visit {
  serviceId: number
  serviceName?: string
  waitMinutes: number
  outcome: HistoryOutcome
  /** Epoch ms the visit ended. Defaults to now. */
  endedAt?: number
  /** Which seeded user (1 or 2). Defaults to 1. */
  userId?: number
}

// Writes one visit through the real recordHistory path. joinedAt is derived so
// recordHistory computes exactly waitMinutes.
async function addVisit(visit: Visit): Promise<void> {
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

describe('generateReport - totals', () => {
  it('reports all-zero totals for an empty history', async () => {
    expect(await generateReport()).toEqual({
      totalServed: 0,
      averageWaitTime: 0,
      queueActivity: 0,
      serviceStatistics: [],
    })
  })

  it('counts only served visits in totalServed', async () => {
    await addVisit({ serviceId: 1, waitMinutes: 18, outcome: 'served' })
    await addVisit({ serviceId: 2, waitMinutes: 10, outcome: 'left' })
    await addVisit({ serviceId: 3, waitMinutes: 12, outcome: 'served' })

    expect((await generateReport()).totalServed).toBe(2)
  })

  it('averages wait time over served visits only, ignoring left ones', async () => {
    await addVisit({ serviceId: 1, waitMinutes: 18, outcome: 'served' })
    await addVisit({ serviceId: 2, waitMinutes: 10, outcome: 'left' }) // excluded
    await addVisit({ serviceId: 3, waitMinutes: 12, outcome: 'served' })

    // (18 + 12) / 2 = 15
    expect((await generateReport()).averageWaitTime).toBe(15)
  })

  it('counts every participation (served + left) in queueActivity', async () => {
    await addVisit({ serviceId: 1, waitMinutes: 18, outcome: 'served' })
    await addVisit({ serviceId: 2, waitMinutes: 10, outcome: 'left' })
    await addVisit({ serviceId: 3, waitMinutes: 12, outcome: 'served' })

    expect((await generateReport()).queueActivity).toBe(3)
  })

  it('reports zero averageWaitTime when no visit was served', async () => {
    await addVisit({ serviceId: 1, waitMinutes: 10, outcome: 'left' })
    const report = await generateReport()
    expect(report.totalServed).toBe(0)
    expect(report.averageWaitTime).toBe(0)
    expect(report.queueActivity).toBe(1)
  })
})

describe('generateReport - serviceStatistics', () => {
  it('produces one row per service, ordered by serviceId', async () => {
    await addVisit({ serviceId: 3, waitMinutes: 12, outcome: 'served' })
    await addVisit({ serviceId: 1, waitMinutes: 18, outcome: 'served' })
    await addVisit({ serviceId: 2, waitMinutes: 10, outcome: 'left' })

    const ids = (await generateReport()).serviceStatistics.map((row) => row.serviceId)
    expect(ids).toEqual([1, 2, 3])
  })

  it('breaks the totals down correctly per service', async () => {
    await addVisit({ serviceId: 1, serviceName: 'Academic Advising', waitMinutes: 18, outcome: 'served' })
    await addVisit({ serviceId: 2, serviceName: 'Financial Aid', waitMinutes: 10, outcome: 'left' })
    await addVisit({ serviceId: 3, serviceName: 'IT Help Desk', waitMinutes: 12, outcome: 'served' })

    expect((await generateReport()).serviceStatistics).toEqual([
      { serviceId: 1, serviceName: 'Academic Advising', totalServed: 1, averageWaitTime: 18, queueActivity: 1 },
      { serviceId: 2, serviceName: 'Financial Aid', totalServed: 0, averageWaitTime: 0, queueActivity: 1 },
      { serviceId: 3, serviceName: 'IT Help Desk', totalServed: 1, averageWaitTime: 12, queueActivity: 1 },
    ])
  })

  it('aggregates multiple visits to the same service and rounds the average to 1dp', async () => {
    // Service 1 served: 18, 11, 20 -> mean 16.333... -> 16.3
    await addVisit({ serviceId: 1, waitMinutes: 18, outcome: 'served' })
    await addVisit({ serviceId: 1, waitMinutes: 11, outcome: 'served', userId: 2 })
    await addVisit({ serviceId: 1, waitMinutes: 20, outcome: 'served' })

    const serviceOne = (await generateReport()).serviceStatistics.find((row) => row.serviceId === 1)!
    expect(serviceOne.totalServed).toBe(3)
    expect(serviceOne.queueActivity).toBe(3)
    expect(serviceOne.averageWaitTime).toBe(16.3)
  })

  it('reports the denormalised service name straight from the history record', async () => {
    // History carries its own serviceName, so reporting never needs the Service row.
    await addVisit({ serviceId: 7, serviceName: 'Since-Deleted Service', waitMinutes: 5, outcome: 'served' })
    const row = (await generateReport()).serviceStatistics.find((r) => r.serviceId === 7)!
    expect(row.serviceName).toBe('Since-Deleted Service')
  })
})

describe('generateReport - filtering', () => {
  // Fixed endedAt values so date boundaries can be asserted exactly.
  beforeEach(async () => {
    await addVisit({ serviceId: 1, waitMinutes: 10, outcome: 'served', endedAt: 1_000_000 })
    await addVisit({ serviceId: 1, waitMinutes: 20, outcome: 'served', endedAt: 2_000_000 })
    await addVisit({ serviceId: 2, waitMinutes: 5, outcome: 'left', endedAt: 3_000_000 })
  })

  it('defaults to the whole history when no filter is given', async () => {
    expect((await generateReport()).queueActivity).toBe(3)
  })

  it('narrows totals to a single service with serviceId', async () => {
    const report = await generateReport({ serviceId: 1 })
    expect(report.totalServed).toBe(2)
    expect(report.averageWaitTime).toBe(15) // (10 + 20) / 2
    expect(report.queueActivity).toBe(2)
    expect(report.serviceStatistics.map((row) => row.serviceId)).toEqual([1])
  })

  it('returns an empty report for a service with no history', async () => {
    expect(await generateReport({ serviceId: 999 })).toEqual({
      totalServed: 0,
      averageWaitTime: 0,
      queueActivity: 0,
      serviceStatistics: [],
    })
  })

  it('drops records before the from bound (inclusive)', async () => {
    // from = 2_000_000 keeps the second and third visits.
    const report = await generateReport({ from: 2_000_000 })
    expect(report.queueActivity).toBe(2)
    expect(report.totalServed).toBe(1)
    expect(report.averageWaitTime).toBe(20)
  })

  it('drops records after the to bound (inclusive)', async () => {
    // to = 2_000_000 keeps the first and second visits.
    const report = await generateReport({ to: 2_000_000 })
    expect(report.queueActivity).toBe(2)
    expect(report.totalServed).toBe(2)
    expect(report.averageWaitTime).toBe(15)
  })

  it('treats from and to as an inclusive range', async () => {
    // Exactly the second visit sits on both bounds.
    const report = await generateReport({ from: 2_000_000, to: 2_000_000 })
    expect(report.queueActivity).toBe(1)
    expect(report.totalServed).toBe(1)
  })

  it('combines a service and a date range', async () => {
    const report = await generateReport({ serviceId: 1, from: 2_000_000 })
    expect(report.queueActivity).toBe(1)
    expect(report.serviceStatistics).toEqual([
      { serviceId: 1, serviceName: 'Service 1', totalServed: 1, averageWaitTime: 20, queueActivity: 1 },
    ])
  })
})

// Pure parsing - no database needed, but it lives here alongside the service.
describe('parseReportFilter', () => {
  it('returns an empty filter for no query params', () => {
    expect(parseReportFilter({})).toEqual({})
    expect(parseReportFilter(undefined)).toEqual({})
  })

  it('parses serviceId into a number', () => {
    expect(parseReportFilter({ serviceId: '3' })).toEqual({ serviceId: 3 })
  })

  it('pins from to the start of the day and to to the end of the day', () => {
    const filter = parseReportFilter({ from: '2026-08-13', to: '2026-08-13' })
    expect(filter.from).toBe(new Date('2026-08-13T00:00:00.000').getTime())
    expect(filter.to).toBe(new Date('2026-08-13T23:59:59.999').getTime())
  })

  it('rejects a non-numeric serviceId', () => {
    expect(() => parseReportFilter({ serviceId: 'abc' })).toThrow()
  })

  it('rejects a zero or negative serviceId', () => {
    expect(() => parseReportFilter({ serviceId: '0' })).toThrow()
    expect(() => parseReportFilter({ serviceId: '-2' })).toThrow()
  })

  it('rejects a malformed date', () => {
    expect(() => parseReportFilter({ from: '13-08-2026' })).toThrow()
    expect(() => parseReportFilter({ to: '2026/08/13' })).toThrow()
  })

  it('rejects a well-formed but impossible date', () => {
    expect(() => parseReportFilter({ from: '2026-13-45' })).toThrow()
  })
})
