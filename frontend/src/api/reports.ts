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

type AdminReportResponse =
  | AdminReport
  | { report: AdminReport }

export async function getAdminReport(
  filters: ReportFilters = {},
): Promise<AdminReport> {
  const params = new URLSearchParams()

  if (filters.serviceId !== undefined) {
    params.set('serviceId', String(filters.serviceId))
  }

  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)

  const query = params.toString()
  const response = await apiGet<AdminReportResponse>(
    `/reports${query ? `?${query}` : ''}`,
  )

  return 'report' in response ? response.report : response
}
