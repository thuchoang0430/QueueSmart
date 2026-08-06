export const PRIORITY_LEVELS = [
  'low',
  'medium',
  'high',
] as const

export type Priority =
  (typeof PRIORITY_LEVELS)[number]
export type ServiceStatus = 'open' | 'closed'

export interface Service {
  id: number
  name: string
  description: string
  duration: number
  priority: Priority
  status: ServiceStatus
}

export interface NewServiceInput {
  name: string
  description: string
  duration: number
  priority: Priority
}


export interface ActivityLogEntry {
  id: string
  message: string
  timestamp: number
}
