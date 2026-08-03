import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '../../api/client'
import {
  getQueue,
  serveNext,
  type QueueEntry,
} from '../../api/queues'
import { useServices } from '../../context/ServicesContext'

interface Toast {
  type: 'success' | 'error'
  message: string
}

const priorityBadge: Record<string, ReactNode> = {
  low: <span className="badge badge-gray">Low priority</span>,
  medium: <span className="badge badge-primary">Medium priority</span>,
  high: <span className="badge badge-warning">High priority</span>,
}

export default function QueueManagement() {
  const { services } = useServices()
  const [searchParams, setSearchParams] = useSearchParams()

  const [toast, setToast] = useState<Toast | null>(null)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [serving, setServing] = useState(false)

  const preselected = searchParams.get('service')

  const [selectedId, setSelectedId] = useState<number | ''>(
    preselected ? Number(preselected) : services[0]?.id ?? '',
  )

  useEffect(() => {
    if (preselected) {
      setSelectedId(Number(preselected))
      return
    }

    if (selectedId === '' && services[0]) {
      setSelectedId(services[0].id)
    }
  }, [preselected, selectedId, services])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => {
      setToast(null)
    }, 3000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [toast])

  const selectedService = services.find(
    (service) => service.id === Number(selectedId),
  )

  const loadQueue = useCallback(async () => {
    if (!selectedService) {
      setQueue([])
      return
    }

    try {
      setLoading(true)

      const response = await getQueue(selectedService.id)

      setQueue(response.queue)
    } catch (error) {
      setQueue([])
      setToast({
        type: 'error',
        message:
          error instanceof ApiError
            ? error.displayMessage
            : 'Unable to load the queue.',
      })
    } finally {
      setLoading(false)
    }
  }, [selectedService])

  useEffect(() => {
    void loadQueue()

    const timer = window.setInterval(() => {
      void loadQueue()
    }, 10000)

    return () => {
      window.clearInterval(timer)
    }
  }, [loadQueue])

  function handleSelectChange(id: string) {
    const nextId = id ? Number(id) : ''

    setSelectedId(nextId)
    setQueue([])
    setSearchParams(id ? { service: id } : {})
  }

  async function handleServeNext() {
    if (!selectedService) {
      return
    }

    try {
      setServing(true)

      const response = await serveNext(selectedService.id)

      setToast({
        type: 'success',
        message: `Served ${response.servedEntry.name} for ${selectedService.name}.`,
      })

      await loadQueue()
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof ApiError
            ? error.displayMessage
            : 'Unable to serve the next user.',
      })
    } finally {
      setServing(false)
    }
  }

  const estimatedTotalWait = selectedService
    ? queue.length * selectedService.duration
    : 0

  return (
    <div className="container">
      <div className="page-header">
        <h1>Queue Management</h1>
        <p>View and manage the live queue for a service.</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <div
            className="form-group"
            style={{ marginBottom: 0, minWidth: 260, flex: 1 }}
          >
            <label htmlFor="service-select">Select a service</label>

            <select
              id="service-select"
              value={selectedId}
              onChange={(event) => handleSelectChange(event.target.value)}
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.status})
                </option>
              ))}
            </select>
          </div>

          {selectedService && (
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Waiting
                </div>

                <div style={{ fontSize: 22, fontWeight: 600 }}>
                  {queue.length}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Est. total wait
                </div>

                <div style={{ fontSize: 22, fontWeight: 600 }}>
                  {estimatedTotalWait} min
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedService && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <h2 style={{ marginBottom: 0 }}>
                  {selectedService.name}
                </h2>

                {selectedService.priority &&
                  priorityBadge[selectedService.priority]}
              </div>

              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                {queue.length} {queue.length === 1 ? 'person' : 'people'} waiting
                {' · '}~{selectedService.duration} min per person
              </p>
            </div>

            <div className="btn-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void loadQueue()}
                disabled={loading || serving}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>

              <button
                type="button"
                className="btn btn-success"
                onClick={handleServeNext}
                disabled={queue.length === 0 || serving}
                style={
                  queue.length === 0 || serving
                    ? { opacity: 0.5, cursor: 'not-allowed' }
                    : {}
                }
              >
                {serving ? 'Serving...' : 'Serve Next User'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            {loading && queue.length === 0 ? (
              <div className="empty">
                <p>Loading the live queue...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="empty">
                <p
                  style={{
                    marginBottom: 4,
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}
                >
                  No one is waiting
                </p>

                <p>
                  People who join this service&apos;s queue will show up here.
                </p>
              </div>
            ) : (
              queue.map((user) => (
                <div className="queue-user-item" key={user.id}>
                  <div
                    className="pos"
                    style={
                      user.position === 1
                        ? {
                            background: 'var(--success-light)',
                            color: 'var(--success)',
                          }
                        : {}
                    }
                  >
                    {user.position}
                  </div>

                  <div className="info">
                    <div className="email">
                      {user.name}

                      {user.position === 1 && (
                        <span
                          className="badge badge-success"
                          style={{ marginLeft: 8 }}
                        >
                          Up next
                        </span>
                      )}

                      {user.priority === 'priority' && (
                        <span
                          className="badge badge-warning"
                          style={{ marginLeft: 8 }}
                        >
                          Priority
                        </span>
                      )}
                    </div>

                    <div className="joined">
                      {user.email}
                      {' · '}estimated wait {user.estimatedWaitMinutes} min
                      {' · '}joined{' '}
                      {Math.max(
                        0,
                        Math.floor((Date.now() - user.joinedAt) / 60000),
                      )}{' '}
                      min ago
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
