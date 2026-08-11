import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { ApiError } from '../../api/client'
import {
  getAdminReport,
  type AdminReport,
  type ReportFilters,
} from '../../api/reports'
import { useServices } from '../../context/ServicesContext'

interface PreviewService {
  id: number
  name: string
  duration: number
}

const DEFAULT_PREVIEW_SERVICES: PreviewService[] = [
  { id: 1, name: 'Advising', duration: 15 },
  { id: 2, name: 'Financial Aid', duration: 20 },
  { id: 3, name: 'Registration', duration: 12 },
]

function buildPreviewReport(
  services: PreviewService[],
  filters: ReportFilters,
): AdminReport {
  const source =
    services.length > 0
      ? services
      : DEFAULT_PREVIEW_SERVICES

  const filtered = filters.serviceId
    ? source.filter(
        (service) => service.id === filters.serviceId,
      )
    : source

  const serviceStatistics = filtered.map((service) => {
    const totalServed =
      18 + ((service.id * 13) % 41)
    const averageWaitTime = Math.max(
      4,
      service.duration + (service.id % 3) * 2 - 2,
    )
    const queueActivity =
      totalServed + 7 + ((service.id * 5) % 16)

    return {
      serviceId: service.id,
      serviceName: service.name,
      totalServed,
      averageWaitTime,
      queueActivity,
    }
  })

  const totalServed = serviceStatistics.reduce(
    (sum, item) => sum + item.totalServed,
    0,
  )

  const weightedWaitTotal = serviceStatistics.reduce(
    (sum, item) =>
      sum + item.averageWaitTime * item.totalServed,
    0,
  )

  const averageWaitTime =
    totalServed === 0
      ? 0
      : weightedWaitTotal / totalServed

  const queueActivity = serviceStatistics.reduce(
    (sum, item) => sum + item.queueActivity,
    0,
  )

  return {
    totalServed,
    averageWaitTime,
    queueActivity,
    serviceStatistics,
    generatedAt: new Date().toISOString(),
  }
}

function csvCell(value: string | number): string {
  const text = String(value)

  if (!/[",\n]/.test(text)) return text

  return `"${text.replaceAll('"', '""')}"`
}

function canUsePreviewData(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 0 || error.status === 404)
  )
}

export default function Reports() {
  const { services } = useServices()

  const [serviceId, setServiceId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appliedFilters, setAppliedFilters] =
    useState<ReportFilters>({})

  const [report, setReport] =
    useState<AdminReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingPreview, setUsingPreview] =
    useState(false)

  const loadReport = useCallback(
    async (filters: ReportFilters) => {
      try {
        setLoading(true)
        setError(null)

        const data = await getAdminReport(filters)

        setReport(data)
        setUsingPreview(false)
      } catch (loadError) {
        if (canUsePreviewData(loadError)) {
          setReport(
            buildPreviewReport(services, filters),
          )
          setUsingPreview(true)
          setError(null)
          return
        }

        setReport(null)
        setUsingPreview(false)
        setError(
          loadError instanceof ApiError
            ? loadError.displayMessage
            : 'Unable to load reporting data.',
        )
      } finally {
        setLoading(false)
      }
    },
    [services],
  )

  useEffect(() => {
    void loadReport(appliedFilters)
  }, [appliedFilters, loadReport])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      fromDate &&
      toDate &&
      new Date(fromDate) > new Date(toDate)
    ) {
      setError('The start date must be before the end date.')
      return
    }

    setError(null)
    setAppliedFilters({
      serviceId: serviceId
        ? Number(serviceId)
        : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    })
  }

  function handleReset() {
    setServiceId('')
    setFromDate('')
    setToDate('')
    setError(null)
    setAppliedFilters({})
  }

  function handleExportCsv() {
    if (!report) return

    const selectedService = services.find(
      (service) =>
        service.id === appliedFilters.serviceId,
    )

    const rows: Array<Array<string | number>> = [
      ['QueueSmart Admin Report'],
      [
        'Generated',
        report.generatedAt ?? new Date().toISOString(),
      ],
      [
        'Service Filter',
        selectedService?.name ?? 'All Services',
      ],
      ['From Date', appliedFilters.from ?? 'All dates'],
      ['To Date', appliedFilters.to ?? 'All dates'],
      [],
      ['Total Served', report.totalServed],
      [
        'Average Wait Time (minutes)',
        report.averageWaitTime.toFixed(1),
      ],
      ['Queue Activity', report.queueActivity],
      [],
      [
        'Service',
        'Total Served',
        'Average Wait Time (minutes)',
        'Queue Activity',
      ],
      ...report.serviceStatistics.map((item) => [
        item.serviceName,
        item.totalServed,
        item.averageWaitTime.toFixed(1),
        item.queueActivity,
      ]),
    ]

    const csv = rows
      .map((row) => row.map(csvCell).join(','))
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `queuesmart-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin Reports</h1>
        <p>
          Review queue performance, wait times, and
          service activity.
        </p>
      </div>

      {usingPreview && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            borderColor: 'var(--warning)',
            background: 'var(--warning-light)',
          }}
        >
          Preview data is shown because the reporting API
          is not available yet. The page will use live
          report data automatically when the endpoint is
          connected.
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            borderColor: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <h2>Report Filters</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-3">
            <div className="form-group">
              <label htmlFor="report-service">
                Service
              </label>
              <select
                id="report-service"
                value={serviceId}
                onChange={(event) =>
                  setServiceId(event.target.value)
                }
              >
                <option value="">All Services</option>
                {services.map((service) => (
                  <option
                    key={service.id}
                    value={service.id}
                  >
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="report-from">
                From Date
              </label>
              <input
                id="report-from"
                type="date"
                value={fromDate}
                onChange={(event) =>
                  setFromDate(event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="report-to">
                To Date
              </label>
              <input
                id="report-to"
                type="date"
                value={toDate}
                onChange={(event) =>
                  setToDate(event.target.value)
                }
              />
            </div>
          </div>

          <div className="btn-row">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div
        className="grid grid-3"
        style={{ marginBottom: 24 }}
      >
        <div className="stat">
          <div className="label">Total Served</div>
          <div className="value">
            {loading && !report
              ? '...'
              : report?.totalServed ?? 0}
          </div>
          <div className="hint">
            Customers completed
          </div>
        </div>

        <div className="stat">
          <div className="label">
            Average Wait Time
          </div>
          <div className="value">
            {loading && !report
              ? '...'
              : `${report?.averageWaitTime.toFixed(1) ?? '0.0'} min`}
          </div>
          <div className="hint">
            Across the selected services
          </div>
        </div>

        <div className="stat">
          <div className="label">Queue Activity</div>
          <div className="value">
            {loading && !report
              ? '...'
              : report?.queueActivity ?? 0}
          </div>
          <div className="hint">
            Queue events in this report
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <div>
            <h2 style={{ marginBottom: 4 }}>
              Service Statistics
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              Performance totals for each service in the
              selected report.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-success"
            onClick={handleExportCsv}
            disabled={loading || !report}
          >
            Export CSV
          </button>
        </div>

        {loading && !report ? (
          <p className="empty">Loading report...</p>
        ) : report &&
          report.serviceStatistics.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Total Served</th>
                <th>Average Wait</th>
                <th>Queue Activity</th>
              </tr>
            </thead>

            <tbody>
              {report.serviceStatistics.map((item) => (
                <tr key={item.serviceId}>
                  <td>{item.serviceName}</td>
                  <td>{item.totalServed}</td>
                  <td>
                    {item.averageWaitTime.toFixed(1)} min
                  </td>
                  <td>{item.queueActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty">
            No report data matches the selected filters.
          </p>
        )}
      </div>
    </div>
  )
}
