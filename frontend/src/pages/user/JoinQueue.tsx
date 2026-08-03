import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import {
  getQueueStatus,
  joinQueue,
  leaveQueue,
  type QueueEntry,
} from '../../api/queues'
import { useAuth } from '../../context/AuthContext'
import { useServices } from '../../context/ServicesContext'

interface ActiveQueue {
  serviceId: number
  entry: QueueEntry
}

export default function JoinQueue() {
  const { currentUser } = useAuth()
  const { services } = useServices()

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [activeQueue, setActiveQueue] = useState<ActiveQueue | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  const openServices = services.filter((service) => service.status === 'open')
  const selectedService = services.find(
    (service) => service.id === selectedServiceId,
  )

  useEffect(() => {
    if (!currentUser) {
      setActiveQueue(null)
      setCheckingStatus(false)
      return
    }

    let cancelled = false

    async function loadActiveQueue() {
      setCheckingStatus(true)

      for (const service of services) {
        try {
          const response = await getQueueStatus(service.id)

          if (!cancelled) {
            setActiveQueue({
              serviceId: service.id,
              entry: response.entry,
            })
            setSelectedServiceId(service.id)
          }

          setCheckingStatus(false)
          return
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) {
            continue
          }

          if (!cancelled) {
            setMessage(
              error instanceof ApiError
                ? error.displayMessage
                : 'Unable to check your queue status.',
            )
          }

          setCheckingStatus(false)
          return
        }
      }

      if (!cancelled) {
        setActiveQueue(null)
        setCheckingStatus(false)
      }
    }

    void loadActiveQueue()

    return () => {
      cancelled = true
    }
  }, [currentUser, services])

  async function handleJoin(serviceId: number) {
    if (!currentUser) {
      setMessage('Please log in before joining a queue.')
      return
    }

    if (activeQueue) {
      setMessage('You are already waiting in a queue. Leave it before joining another one.')
      return
    }

    const service = services.find((item) => item.id === serviceId)

    if (!service) {
      setMessage('Please select a valid service.')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const response = await joinQueue(serviceId)

      setActiveQueue({
        serviceId,
        entry: response.entry,
      })
      setSelectedServiceId(serviceId)
      setMessage(`You joined the ${service.name} queue.`)
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.displayMessage
          : 'Unable to join the queue.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleLeaveQueue() {
    if (!activeQueue) {
      setMessage('You are not currently in a queue.')
      return
    }

    try {
      setLoading(true)
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
      setLoading(false)
    }
  }

  const activeService = activeQueue
    ? services.find((service) => service.id === activeQueue.serviceId)
    : null

  return (
    <div>
      <div className="page-header">
        <h1>Join a queue</h1>
        <p>Pick a service and join the live queue.</p>
      </div>

      {message && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {checkingStatus && (
        <div className="mb-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Checking your current queue status...
        </div>
      )}

      {activeQueue && activeService && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          You are currently in the {activeService.name} queue at position #
          {activeQueue.entry.position}. Estimated wait:{' '}
          {activeQueue.entry.estimatedWaitMinutes} minutes.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {openServices.map((service) => {
          const isSelected = selectedServiceId === service.id
          const isCurrentQueue = activeQueue?.serviceId === service.id

          return (
            <div
              key={service.id}
              className={`rounded-lg border bg-white p-5 shadow-sm ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-slate-200'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  {service.name}
                </h2>

                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium capitalize text-blue-700">
                  {service.priority}
                </span>
              </div>

              <p className="mb-4 text-sm text-slate-600">
                {service.description}
              </p>

              <div className="mb-4 space-y-1 text-sm text-slate-600">
                <p>{service.duration} minutes per person</p>

                {isCurrentQueue && activeQueue && (
                  <>
                    <p>Position #{activeQueue.entry.position}</p>
                    <p>
                      {activeQueue.entry.estimatedWaitMinutes} minutes estimated wait
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedServiceId(service.id)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Select
                </button>

                <button
                  type="button"
                  onClick={() => handleJoin(service.id)}
                  disabled={loading || Boolean(activeQueue)}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCurrentQueue ? 'Joined' : 'Join queue'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-base font-semibold text-slate-900">
          Selected service
        </h2>

        {selectedService ? (
          <div className="text-sm text-slate-600">
            <p>
              <strong>Service:</strong> {selectedService.name}
            </p>

            <p>
              <strong>Duration:</strong> {selectedService.duration} minutes per person
            </p>

            {activeQueue && activeQueue.serviceId === selectedService.id && (
              <>
                <p>
                  <strong>Your position:</strong> #{activeQueue.entry.position}
                </p>

                <p>
                  <strong>Estimated wait:</strong>{' '}
                  {activeQueue.entry.estimatedWaitMinutes} minutes
                </p>
              </>
            )}

            <button
              type="button"
              onClick={handleLeaveQueue}
              disabled={
                loading ||
                !activeQueue ||
                activeQueue.serviceId !== selectedService.id
              }
              className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Leave my queue
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No service selected yet.</p>
        )}
      </div>
    </div>
  )
}
