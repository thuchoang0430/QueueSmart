import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import {
  getQueueStatus,
  leaveQueue,
  type QueueEntry,
} from '../../api/queues'
import { useAuth } from '../../context/AuthContext'
import { useServices } from '../../context/ServicesContext'

interface ActiveQueue {
  serviceId: number
  entry: QueueEntry
}

export default function QueueStatus() {
  const { currentUser } = useAuth()
  const { services } = useServices()

  const [activeQueue, setActiveQueue] = useState<ActiveQueue | null>(null)
  const [loading, setLoading] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadQueueStatus = useCallback(async () => {
    if (!currentUser) {
      setActiveQueue(null)
      setLoading(false)
      return
    }

    setLoading(true)

    for (const service of services) {
      try {
        const response = await getQueueStatus(service.id)

        setActiveQueue({
          serviceId: service.id,
          entry: response.entry,
        })
        setMessage('')
        setLoading(false)
        return
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          continue
        }

        setMessage(
          error instanceof ApiError
            ? error.displayMessage
            : 'Unable to load your queue status.',
        )
        setLoading(false)
        return
      }
    }

    setActiveQueue(null)
    setLoading(false)
  }, [currentUser, services])

  useEffect(() => {
    void loadQueueStatus()

    const timer = window.setInterval(() => {
      void loadQueueStatus()
    }, 10000)

    return () => {
      window.clearInterval(timer)
    }
  }, [loadQueueStatus])

  async function handleLeaveQueue() {
    if (!activeQueue) {
      return
    }

    try {
      setLeaving(true)
      setMessage('')

      await leaveQueue(activeQueue.serviceId)

      setActiveQueue(null)
      setMessage('You left the queue.')
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.displayMessage
          : 'Unable to leave the queue.',
      )
    } finally {
      setLeaving(false)
    }
  }

  if (!currentUser) {
    return (
      <div>
        <div className="page-header">
          <h1>Queue Status</h1>
          <p>Please log in to view your current queue status.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            No user is currently logged in.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Queue Status</h1>
          <p>View your current position, wait time, and queue update.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            Loading your queue status...
          </p>
        </div>
      </div>
    )
  }

  if (!activeQueue) {
    return (
      <div>
        <div className="page-header">
          <h1>Queue Status</h1>
          <p>View your current position, wait time, and queue update.</p>
        </div>

        {message && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {message}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            No active queue
          </h2>

          <p className="text-sm text-slate-600">
            You are not currently waiting in any queue. Go to Join Queue to
            select a service.
          </p>
        </div>
      </div>
    )
  }

  const service = services.find(
    (item) => item.id === activeQueue.serviceId,
  )

  const position = activeQueue.entry.position
  const estimatedWait = activeQueue.entry.estimatedWaitMinutes

  let status = 'Waiting'
  let badgeClass = 'bg-blue-100 text-blue-700'
  let notification = 'You are checked in. Please wait for your turn.'

  if (position === 1) {
    status = 'Almost Ready'
    badgeClass = 'bg-green-100 text-green-700'
    notification = 'You are next. Please stay nearby.'
  } else if (position <= 3) {
    status = 'Getting Close'
    badgeClass = 'bg-yellow-100 text-yellow-700'
    notification = 'Your turn is getting close. Please be ready.'
  }

  return (
    <div>
      <div className="page-header">
        <h1>Queue Status</h1>
        <p>
          View your current position, estimated wait time, and queue updates.
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Service</p>

          <p className="mt-2 text-xl font-semibold text-slate-900">
            {service?.name ?? `Service ${activeQueue.serviceId}`}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Current Position
          </p>

          <p className="mt-2 text-4xl font-bold text-blue-600">
            #{position}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Estimated Wait
          </p>

          <p className="mt-2 text-xl font-semibold text-slate-900">
            {estimatedWait} minutes
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Current Status
          </h2>

          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${badgeClass}`}
          >
            {status}
          </span>
        </div>

        <p className="text-sm text-slate-600">{notification}</p>

        <div className="mt-5 space-y-2 text-sm text-slate-600">
          <p>
            <strong>Name:</strong> {activeQueue.entry.name}
          </p>

          <p>
            <strong>Email:</strong> {activeQueue.entry.email}
          </p>

          <p>
            <strong>People ahead of you:</strong>{' '}
            {Math.max(0, position - 1)}
          </p>

          <p>
            <strong>Priority:</strong>{' '}
            <span className="capitalize">
              {activeQueue.entry.priority}
            </span>
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => void loadQueueStatus()}
            disabled={loading || leaving}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh status
          </button>

          <button
            type="button"
            onClick={handleLeaveQueue}
            disabled={leaving}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {leaving ? 'Leaving...' : 'Leave queue'}
          </button>
        </div>
      </div>
    </div>
  )
}
