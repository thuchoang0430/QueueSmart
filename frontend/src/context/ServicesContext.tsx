import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { ApiError } from '../api/client'
import {
  createService,
  deleteService,
  getServices,
  updateService as updateServiceApi,
  updateServiceStatus,
} from '../api/services'
import { initialQueues } from '../data/mockQueues'
import type {
  ActivityLogEntry,
  NewServiceInput,
  QueueMap,
  QueueUser,
  Service,
} from '../types'

const ACTIVITY_LOG_LIMIT = 20

interface ServicesContextValue {
  services: Service[]
  servicesLoading: boolean
  servicesError: string | null
  clearServicesError: () => void
  refreshServices: () => Promise<void>
  addService: (
    service: NewServiceInput,
  ) => Promise<Service>
  updateService: (
    id: number,
    changes: NewServiceInput,
  ) => Promise<Service>
  toggleServiceStatus: (
    id: number,
  ) => Promise<Service>
  removeService: (id: number) => Promise<void>
  queues: QueueMap
  getQueue: (serviceId: number) => QueueUser[]
  joinQueue: (
    serviceId: number,
    user: { name: string; email: string },
  ) => void
  moveQueueUser: (
    serviceId: number,
    userId: string,
    direction: 'up' | 'down',
  ) => void
  removeFromQueue: (
    serviceId: number,
    userId: string,
  ) => void
  serveNextUser: (
    serviceId: number,
  ) => QueueUser | null
  activityLog: ActivityLogEntry[]
}

const ServicesContext =
  createContext<ServicesContextValue | null>(null)

let nextActivityId = 1

function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.displayMessage
    : 'Unable to complete the service request.'
}

export function ServicesProvider({
  children,
}: {
  children: ReactNode
}) {
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] =
    useState(true)
  const [servicesError, setServicesError] =
    useState<string | null>(null)

  const [queues, setQueues] =
    useState<QueueMap>(initialQueues)

  const [activityLog, setActivityLog] = useState<
    ActivityLogEntry[]
  >([])

  function logActivity(message: string) {
    const entry: ActivityLogEntry = {
      id: `activity-${nextActivityId++}`,
      message,
      timestamp: Date.now(),
    }

    setActivityLog((previous) =>
      [entry, ...previous].slice(
        0,
        ACTIVITY_LOG_LIMIT,
      ),
    )
  }

  function clearServicesError() {
    setServicesError(null)
  }

  async function refreshServices(): Promise<void> {
    try {
      setServicesLoading(true)
      setServicesError(null)

      const response = await getServices()
      setServices(response.services)
    } catch (error) {
      setServices([])
      setServicesError(errorMessage(error))
    } finally {
      setServicesLoading(false)
    }
  }

  useEffect(() => {
    void refreshServices()
  }, [])

  async function addService(
    input: NewServiceInput,
  ): Promise<Service> {
    try {
      setServicesError(null)

      const response = await createService(input)
      const service = response.service

      setServices((previous) =>
        [...previous, service].sort(
          (left, right) => left.id - right.id,
        ),
      )

      setQueues((previous) => ({
        ...previous,
        [service.id]: [],
      }))

      logActivity(
        `Created service "${service.name}"`,
      )

      return service
    } catch (error) {
      setServicesError(errorMessage(error))
      throw error
    }
  }

  async function updateService(
    id: number,
    changes: NewServiceInput,
  ): Promise<Service> {
    try {
      setServicesError(null)

      const response = await updateServiceApi(
        id,
        changes,
      )

      const service = response.service

      setServices((previous) =>
        previous.map((item) =>
          item.id === id ? service : item,
        ),
      )

      logActivity(
        `Updated service "${service.name}"`,
      )

      return service
    } catch (error) {
      setServicesError(errorMessage(error))
      throw error
    }
  }

  async function toggleServiceStatus(
    id: number,
  ): Promise<Service> {
    const target = services.find(
      (service) => service.id === id,
    )

    if (!target) {
      throw new Error(
        `No service with id ${id}.`,
      )
    }

    const nextStatus =
      target.status === 'open'
        ? 'closed'
        : 'open'

    try {
      setServicesError(null)

      const response = await updateServiceStatus(
        id,
        nextStatus,
      )

      const service = response.service

      setServices((previous) =>
        previous.map((item) =>
          item.id === id ? service : item,
        ),
      )

      logActivity(
        `${
          nextStatus === 'open'
            ? 'Opened'
            : 'Closed'
        } queue for "${service.name}"`,
      )

      return service
    } catch (error) {
      setServicesError(errorMessage(error))
      throw error
    }
  }

  async function removeService(
    id: number,
  ): Promise<void> {
    try {
      setServicesError(null)

      const response = await deleteService(id)

      setServices((previous) =>
        previous.filter(
          (service) => service.id !== id,
        ),
      )

      setQueues((previous) => {
        const next = { ...previous }
        delete next[id]
        return next
      })

      logActivity(
        `Deleted service "${response.service.name}"`,
      )
    } catch (error) {
      setServicesError(errorMessage(error))
      throw error
    }
  }

  function getQueue(
    serviceId: number,
  ): QueueUser[] {
    return queues[serviceId] ?? []
  }

  function joinQueue(
    serviceId: number,
    user: { name: string; email: string },
  ) {
    setQueues((previous) => {
      const list =
        previous[serviceId] ?? []

      const alreadyInQueue = list.some(
        (queueUser) =>
          queueUser.email === user.email,
      )

      if (alreadyInQueue) {
        return previous
      }

      const newUser: QueueUser = {
        id: `${serviceId}-${user.email}`,
        name: user.name,
        email: user.email,
        joinedMinutesAgo: 0,
      }

      return {
        ...previous,
        [serviceId]: [
          ...list,
          newUser,
        ],
      }
    })
  }

  function moveQueueUser(
    serviceId: number,
    userId: string,
    direction: 'up' | 'down',
  ) {
    setQueues((previous) => {
      const list = [
        ...(previous[serviceId] ?? []),
      ]

      const index = list.findIndex(
        (user) => user.id === userId,
      )

      const swapWith =
        direction === 'up'
          ? index - 1
          : index + 1

      if (
        index < 0 ||
        swapWith < 0 ||
        swapWith >= list.length
      ) {
        return previous
      }

      ;[list[index], list[swapWith]] = [
        list[swapWith],
        list[index],
      ]

      return {
        ...previous,
        [serviceId]: list,
      }
    })
  }

  function removeFromQueue(
    serviceId: number,
    userId: string,
  ) {
    setQueues((previous) => ({
      ...previous,
      [serviceId]: (
        previous[serviceId] ?? []
      ).filter((user) => user.id !== userId),
    }))
  }

  function serveNextUser(
    serviceId: number,
  ): QueueUser | null {
    let served: QueueUser | null = null

    setQueues((previous) => {
      const list =
        previous[serviceId] ?? []

      if (list.length === 0) {
        return previous
      }

      served = list[0]

      return {
        ...previous,
        [serviceId]: list.slice(1),
      }
    })

    return served
  }

  return (
    <ServicesContext.Provider
      value={{
        services,
        servicesLoading,
        servicesError,
        clearServicesError,
        refreshServices,
        addService,
        updateService,
        toggleServiceStatus,
        removeService,
        queues,
        getQueue,
        joinQueue,
        moveQueueUser,
        removeFromQueue,
        serveNextUser,
        activityLog,
      }}
    >
      {children}
    </ServicesContext.Provider>
  )
}

export function useServices(): ServicesContextValue {
  const context = useContext(ServicesContext)

  if (!context) {
    throw new Error(
      'useServices must be used within a ServicesProvider',
    )
  }

  return context
}
