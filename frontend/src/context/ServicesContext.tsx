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
import type {
  ActivityLogEntry,
  NewServiceInput,
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

      logActivity(
        `Deleted service "${response.service.name}"`,
      )
    } catch (error) {
      setServicesError(errorMessage(error))
      throw error
    }
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
