import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from './client'
import type {
  NewServiceInput,
  Service,
  ServiceStatus,
} from '../types'

interface ServicesResponse {
  services: Service[]
}

interface ServiceResponse {
  service: Service
}

export function getServices(): Promise<ServicesResponse> {
  return apiGet<ServicesResponse>('/services')
}

export function createService(
  input: NewServiceInput,
): Promise<ServiceResponse> {
  return apiPost<ServiceResponse>('/services', input)
}

export function updateService(
  id: number,
  input: NewServiceInput,
): Promise<ServiceResponse> {
  return apiPut<ServiceResponse>(`/services/${id}`, input)
}

export function updateServiceStatus(
  id: number,
  status: ServiceStatus,
): Promise<ServiceResponse> {
  return apiPatch<ServiceResponse>(
    `/services/${id}/status`,
    { status },
  )
}

export function deleteService(
  id: number,
): Promise<ServiceResponse> {
  return apiDelete<ServiceResponse>(`/services/${id}`)
}
