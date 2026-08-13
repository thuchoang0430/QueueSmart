import { store, type HistoryRecord } from '../../store/memoryStore'

// Reporting module for A4. Aggregates the history log into the numbers the
// Admin Reports page shows. This is an admin-wide view over every user's
// visits, unlike the history module which only ever returns one user's records.
//
// Everything is derived from store.history: each completed visit lands there
// (served or left) carrying serviceId, a denormalised serviceName, waitMinutes
// and the outcome. As with every module this is plain logic over the store -
// no Express here, which is where the unit-test coverage comes from.

/** Per-service slice of the report. Field names are the contract the frontend consumes. */
export interface ServiceReport {
  serviceId: number
  serviceName: string
  totalServed: number
  averageWaitTime: number
  queueActivity: number
}

/** The whole Admin Reports payload. */
export interface ReportSummary {
  totalServed: number
  averageWaitTime: number
  queueActivity: number
  serviceStatistics: ServiceReport[]
}

/** Rounds to one decimal place so averages read cleanly without float noise. */
function roundTo1dp(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Mean wait time over *served* visits only, in minutes. People who left the
 * queue never waited a full service, so folding them in would understate the
 * real wait. Returns 0 when nobody in the set was served.
 */
function averageServedWait(records: HistoryRecord[]): number {
  const served = records.filter((record) => record.outcome === 'served')
  if (served.length === 0) return 0

  const total = served.reduce((sum, record) => sum + record.waitMinutes, 0)
  return roundTo1dp(total / served.length)
}

/** Groups records by serviceId, preserving insertion order of first appearance. */
function groupByService(records: HistoryRecord[]): Map<number, HistoryRecord[]> {
  const groups = new Map<number, HistoryRecord[]>()

  for (const record of records) {
    const existing = groups.get(record.serviceId)
    if (existing) {
      existing.push(record)
    } else {
      groups.set(record.serviceId, [record])
    }
  }

  return groups
}

/** Builds the per-service statistics, ordered by serviceId for a stable table. */
function buildServiceStatistics(records: HistoryRecord[]): ServiceReport[] {
  return [...groupByService(records).entries()]
    .map(([serviceId, group]) => ({
      serviceId,
      // Denormalised name off the latest record, so a deleted service still reports.
      serviceName: group[group.length - 1].serviceName,
      totalServed: group.filter((record) => record.outcome === 'served').length,
      averageWaitTime: averageServedWait(group),
      queueActivity: group.length,
    }))
    .sort((first, second) => first.serviceId - second.serviceId)
}

/**
 * Produces the full admin report over the current history log.
 *
 * - totalServed:     visits that ended in 'served'
 * - averageWaitTime: mean waitMinutes of served visits (minutes, 1 dp)
 * - queueActivity:   total participations recorded (served + left)
 * - serviceStatistics: the same three numbers broken down per service
 */
export function generateReport(): ReportSummary {
  const records = store.history

  return {
    totalServed: records.filter((record) => record.outcome === 'served').length,
    averageWaitTime: averageServedWait(records),
    queueActivity: records.length,
    serviceStatistics: buildServiceStatistics(records),
  }
}
