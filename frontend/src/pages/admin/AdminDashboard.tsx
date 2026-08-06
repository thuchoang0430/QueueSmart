import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { getQueue } from '../../api/queues'
import { useServices } from '../../context/ServicesContext'
import type { Priority } from '../../types'

const priorityBadge: Record<Priority, string> = {
  low: 'badge-gray',
  medium: 'badge-warning',
  high: 'badge-danger',
}

function formatRelativeTime(
  timestamp: number,
): string {
  const seconds = Math.floor(
    (Date.now() - timestamp) / 1000,
  )

  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)

  return `${hours}h ago`
}

export default function AdminDashboard() {
  const {
    services,
    servicesLoading,
    servicesError,
    toggleServiceStatus,
    activityLog,
  } = useServices()

  const [queueLengths, setQueueLengths] = useState<
    Record<number, number>
  >({})

  const [queuesLoading, setQueuesLoading] =
    useState(false)

  const [queuesError, setQueuesError] =
    useState<string | null>(null)

  const loadQueueLengths = useCallback(async () => {
    if (services.length === 0) {
      setQueueLengths({})
      setQueuesError(null)
      return
    }

    try {
      setQueuesLoading(true)
      setQueuesError(null)

      const responses = await Promise.all(
        services.map(async (service) => {
          const response = await getQueue(service.id)

          return {
            serviceId: service.id,
            total: response.total,
          }
        }),
      )

      const next: Record<number, number> = {}

      for (const response of responses) {
        next[response.serviceId] = response.total
      }

      setQueueLengths(next)
    } catch (error) {
      setQueuesError(
        error instanceof ApiError
          ? error.displayMessage
          : 'Unable to load live queue totals.',
      )
    } finally {
      setQueuesLoading(false)
    }
  }, [services])

  useEffect(() => {
    void loadQueueLengths()

    const timer = window.setInterval(() => {
      void loadQueueLengths()
    }, 10000)

    return () => {
      window.clearInterval(timer)
    }
  }, [loadQueueLengths])

  async function handleToggleService(
    id: number,
  ) {
    try {
      await toggleServiceStatus(id)
    } catch {
      // The context exposes the backend error.
    }
  }

  const openCount = services.filter(
    (service) => service.status === 'open',
  ).length

  const totalWaiting = Object.values(
    queueLengths,
  ).reduce((sum, count) => sum + count, 0)

  const recentActivity = activityLog.slice(0, 5)

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>
          Overview of all services and their current
          queues.
        </p>
      </div>

      {servicesError && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            borderColor: 'var(--danger)',
          }}
        >
          {servicesError}
        </div>
      )}

      {queuesError && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            borderColor: 'var(--danger)',
          }}
        >
          {queuesError}
        </div>
      )}

      {servicesLoading && (
        <div
          className="card"
          style={{ marginBottom: 16 }}
        >
          Loading services...
        </div>
      )}

      <div
        className="grid grid-3"
        style={{ marginBottom: 24 }}
      >
        <div className="stat">
          <div className="label">
            Total Services
          </div>
          <div className="value">
            {services.length}
          </div>
        </div>

        <div className="stat">
          <div className="label">
            Open Services
          </div>
          <div className="value">
            {openCount}
          </div>
        </div>

        <div className="stat">
          <div className="label">
            People Waiting
          </div>
          <div className="value">
            {queuesLoading &&
            Object.keys(queueLengths).length === 0
              ? '...'
              : totalWaiting}
          </div>
          <div className="hint">
            Across all services
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Services</h2>

        {services.length === 0 ? (
          <p className="empty">
            No services yet. Add one from Service
            Management.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Queue Length</th>
                <th>Expected Duration</th>
                <th>Quick Action</th>
              </tr>
            </thead>

            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>{service.name}</td>

                  <td>
                    <span
                      className={`badge ${
                        priorityBadge[
                          service.priority
                        ]
                      }`}
                    >
                      {service.priority}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        service.status === 'open'
                          ? 'badge-success'
                          : 'badge-gray'
                      }`}
                    >
                      {service.status}
                    </span>
                  </td>

                  <td>
                    {queuesLoading &&
                    queueLengths[service.id] ===
                      undefined
                      ? '...'
                      : queueLengths[
                          service.id
                        ] ?? 0}
                  </td>

                  <td>
                    {service.duration} min
                  </td>

                  <td>
                    <div className="btn-row">
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          service.status === 'open'
                            ? 'btn-danger'
                            : 'btn-success'
                        }`}
                        onClick={() =>
                          void handleToggleService(
                            service.id,
                          )
                        }
                      >
                        {service.status === 'open'
                          ? 'Close Queue'
                          : 'Open Queue'}
                      </button>

                      <Link
                        className="btn btn-secondary btn-sm"
                        to={`/admin/queue-management?service=${service.id}`}
                      >
                        Manage Queue
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div
        className="card"
        style={{ marginTop: 16 }}
      >
        <h2>Recent Activity</h2>

        {recentActivity.length === 0 ? (
          <p className="empty">
            No admin activity yet — actions you take
            will show up here.
          </p>
        ) : (
          <ul className="notification-list">
            {recentActivity.map((entry) => (
              <li
                className="notification-item"
                key={entry.id}
              >
                <div className="dot" />

                <div className="content">
                  <div className="msg">
                    {entry.message}
                  </div>

                  <div className="time">
                    {formatRelativeTime(
                      entry.timestamp,
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
