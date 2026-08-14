import { apiGet } from './client'

export interface ReportFilters {
  serviceId?: number
  from?: string
  to?: string
}

export interface ServiceReportStatistic {
  serviceId: number
  serviceName: string
  totalServed: number
  averageWaitTime: number
  queueActivity: number
}

export interface AdminReport {
  totalServed: number
  averageWaitTime: number
  queueActivity: number
  serviceStatistics: ServiceReportStatistic[]
  generatedAt?: string
}

export interface HistoryReportEntry {
  id: number
  userId: number
  userName: string
  userEmail: string
  serviceId: number
  serviceName: string
  joinedAt: number
  endedAt: number
  waitMinutes: number
  outcome: 'served' | 'left'
}

type AdminReportResponse =
  | AdminReport
  | { report: AdminReport }

interface HistoryReportResponse {
  history: HistoryReportEntry[]
}

function buildReportQuery(
  filters: ReportFilters,
): string {
  const params = new URLSearchParams()

  if (filters.serviceId !== undefined) {
    params.set(
      'serviceId',
      String(filters.serviceId),
    )
  }

  if (filters.from) {
    params.set('from', filters.from)
  }

  if (filters.to) {
    params.set('to', filters.to)
  }

  const query = params.toString()

  return query ? `?${query}` : ''
}

export async function getAdminReport(
  filters: ReportFilters = {},
): Promise<AdminReport> {
  const response =
    await apiGet<AdminReportResponse>(
      `/reports${buildReportQuery(filters)}`,
    )

  return 'report' in response
    ? response.report
    : response
}

export async function getAdminReportHistory(
  filters: ReportFilters = {},
): Promise<HistoryReportEntry[]> {
  const response =
    await apiGet<HistoryReportResponse>(
      `/reports/history${buildReportQuery(
        filters,
      )}`,
    )

  return response.history
}
