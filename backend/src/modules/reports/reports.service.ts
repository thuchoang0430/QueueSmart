import {
  HistoryOutcome as DbOutcome,
  Prisma,
  type History as DbHistory,
} from '../../generated/prisma/client'
import { prisma } from '../../database/prisma'

// Reporting module for A4. Aggregates the persisted History table into the
// numbers the Admin Reports page shows. This is an admin-wide view over every
// user's visits, unlike the history module which only ever returns one user's
// records.
//
// Each completed visit is written to History (served or left) with its
// serviceId, a denormalised serviceName, waitMinutes and outcome. We read those
// rows and fold them into totals here rather than in the database so the
// aggregation logic stays plain and unit-testable.

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

/**
 * Optional narrowing for a report. Every field is independent and combinable.
 * Dates are epoch ms so this stays easy to test - the controller turns the
 * `YYYY-MM-DD` query strings into these bounds.
 */
export interface ReportFilter {
  /** Only count visits to this service. */
  serviceId?: number
  /** Inclusive lower bound on a visit's endedAt (epoch ms). */
  from?: number
  /** Inclusive upper bound on a visit's endedAt (epoch ms). */
  to?: number
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
function averageServedWait(records: DbHistory[]): number {
  const served = records.filter((record) => record.outcome === DbOutcome.SERVED)
  if (served.length === 0) return 0

  const total = served.reduce((sum, record) => sum + record.waitMinutes, 0)
  return roundTo1dp(total / served.length)
}

/** Turns a report filter into a Prisma `where` clause over the History table. */
function buildWhere(filter: ReportFilter): Prisma.HistoryWhereInput {
  const where: Prisma.HistoryWhereInput = {}

  if (filter.serviceId !== undefined) {
    where.serviceId = filter.serviceId
  }

  if (filter.from !== undefined || filter.to !== undefined) {
    where.endedAt = {
      ...(filter.from !== undefined ? { gte: new Date(filter.from) } : {}),
      ...(filter.to !== undefined ? { lte: new Date(filter.to) } : {}),
    }
  }

  return where
}

/** Groups records by serviceId, preserving first-seen order. */
function groupByService(records: DbHistory[]): Map<number, DbHistory[]> {
  const groups = new Map<number, DbHistory[]>()

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
function buildServiceStatistics(records: DbHistory[]): ServiceReport[] {
  return [...groupByService(records).entries()]
    .map(([serviceId, group]) => ({
      serviceId,
      // Denormalised name off the latest record, so a renamed/removed service still reports.
      serviceName: group[group.length - 1].serviceName,
      totalServed: group.filter((record) => record.outcome === DbOutcome.SERVED).length,
      averageWaitTime: averageServedWait(group),
      queueActivity: group.length,
    }))
    .sort((first, second) => first.serviceId - second.serviceId)
}

/**
 * Produces the admin report over the History table, optionally narrowed by
 * `filter` (service and/or an endedAt date range). With no filter it reports
 * over everything.
 *
 * - totalServed:     visits that ended in 'served'
 * - averageWaitTime: mean waitMinutes of served visits (minutes, 1 dp)
 * - queueActivity:   total participations recorded (served + left)
 * - serviceStatistics: the same three numbers broken down per service
 */
export async function generateReport(filter: ReportFilter = {}): Promise<ReportSummary> {
  // Ordered oldest-first so the per-service "latest name" is the last in each group.
  const records = await prisma.history.findMany({
    where: buildWhere(filter),
    orderBy: { endedAt: 'asc' },
  })

  return {
    totalServed: records.filter((record) => record.outcome === DbOutcome.SERVED).length,
    averageWaitTime: averageServedWait(records),
    queueActivity: records.length,
    serviceStatistics: buildServiceStatistics(records),
  }
}
