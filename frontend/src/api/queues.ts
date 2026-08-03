import { apiDelete, apiGet, apiPost } from './client'

export type QueuePriority = 'normal' | 'priority'

export interface QueueEntry {
  id: number
  serviceId: number
  userId: number
  name: string
  email: string
  priority: QueuePriority
  joinedAt: number
  position: number
  estimatedWaitMinutes: number
}

interface JoinQueueResponse {
  message: string
  entry: QueueEntry
}

interface LeaveQueueResponse {
  message: string
  entry: QueueEntry
}

interface QueueStatusResponse {
  entry: QueueEntry
}

interface QueueListResponse {
  queue: QueueEntry[]
  total: number
}

interface ServeNextResponse {
  message: string
  servedEntry: QueueEntry
}

export function joinQueue(
  serviceId: number,
  priority: QueuePriority = 'normal',
): Promise<JoinQueueResponse> {
  return apiPost<JoinQueueResponse>(`/queues/${serviceId}/join`, {
    priority,
  })
}

export function leaveQueue(serviceId: number): Promise<LeaveQueueResponse> {
  return apiDelete<LeaveQueueResponse>(`/queues/${serviceId}/leave`)
}

export function getQueueStatus(
  serviceId: number,
): Promise<QueueStatusResponse> {
  return apiGet<QueueStatusResponse>(`/queues/${serviceId}/status`)
}

export function getQueue(serviceId: number): Promise<QueueListResponse> {
  return apiGet<QueueListResponse>(`/queues/${serviceId}`)
}

export function serveNext(serviceId: number): Promise<ServeNextResponse> {
  return apiPost<ServeNextResponse>(`/queues/${serviceId}/serve`)
}
