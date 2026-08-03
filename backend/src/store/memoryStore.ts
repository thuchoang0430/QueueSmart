// The single source of truth for the whole backend. A3 does not use a database,
// so every module reads and writes these collections. Keeping them behind this
// one module is what makes the A4 swap to real persistence a contained change:
// only this file changes, controllers and services keep their signatures.

export type Priority = 'low' | 'medium' | 'high'
export type ServiceStatus = 'open' | 'closed'
export type Role = 'user' | 'admin'

// Priority carried by a single person waiting, not by the service. Ordering
// needs this to be per-entry, otherwise every entry in a queue ties and the
// arrival-vs-priority rule can never actually change the order.
export type EntryPriority = 'normal' | 'priority'

export type HistoryOutcome = 'served' | 'left'
export type NotificationType = 'joined' | 'almost-up' | 'served'

export interface User {
  id: number
  name: string
  email: string
  // Plain text is acceptable for A3 (no persistence, no real accounts).
  // Hashing belongs with the real data layer in A4.
  password: string
  role: Role
}

export interface Service {
  id: number
  name: string
  description: string
  /** Expected service time in minutes. Drives wait-time estimation. */
  duration: number
  priority: Priority
  status: ServiceStatus
}

export interface QueueEntry {
  id: number
  serviceId: number
  userId: number
  name: string
  email: string
  priority: EntryPriority
  /** Epoch ms. Arrival order tiebreaker and the basis for waited-time. */
  joinedAt: number
}

export interface HistoryRecord {
  id: number
  userId: number
  serviceId: number
  /** Denormalised so history survives the service being deleted. */
  serviceName: string
  joinedAt: number
  endedAt: number
  waitMinutes: number
  outcome: HistoryOutcome
}

export interface Notification {
  id: number
  userId: number
  type: NotificationType
  message: string
  createdAt: number
  read: boolean
}

export interface Store {
  users: User[]
  services: Service[]
  queueEntries: QueueEntry[]
  history: HistoryRecord[]
  notifications: Notification[]
  /** Login token -> user id. Cleared on restart, which is fine for A3. */
  sessions: Map<string, number>
}

// `sessions` is keyed by token, not by a numeric id, so it is excluded from
// the auto-increment counters below.
type Collection = Exclude<keyof Store, 'sessions'>

// Exported as a const object rather than a mutable binding so that
// `import { store }` keeps working after a reset - resetStore() replaces the
// arrays inside, never the object itself.
export const store: Store = {
  users: [],
  services: [],
  queueEntries: [],
  history: [],
  notifications: [],
  sessions: new Map(),
}

const counters: Record<Collection, number> = {
  users: 0,
  services: 0,
  queueEntries: 0,
  history: 0,
  notifications: 0,
}

/** Auto-increment id generator, one sequence per collection. */
export function nextId(collection: Collection): number {
  counters[collection] += 1
  return counters[collection]
}

// Same credentials and services the A2 front end already demos with, so the
// UI behaves identically once it is pointed at the API.
function seedUsers(): User[] {
  return [
    { id: 1, name: 'Student User', email: 'user@test.com', password: 'password', role: 'user' },
    { id: 2, name: 'Admin User', email: 'admin@test.com', password: 'password', role: 'admin' },
  ]
}

function seedServices(): Service[] {
  return [
    {
      id: 1,
      name: 'Academic Advising',
      description: 'General academic guidance and course planning for students.',
      duration: 20,
      priority: 'medium',
      status: 'open',
    },
    {
      id: 2,
      name: 'Financial Aid',
      description: 'Assistance with financial aid applications and questions.',
      duration: 30,
      priority: 'high',
      status: 'open',
    },
    {
      id: 3,
      name: 'IT Help Desk',
      description: 'Technical support for student accounts, devices, and campus wifi.',
      duration: 15,
      priority: 'low',
      status: 'open',
    },
  ]
}

// A few past visits for the seeded student (id 1) so the History page shows
// real backend data before anyone has actually used a queue. Once the queue
// module records live outcomes (via recordHistory in the history module) these
// sit alongside the real ones.
const DAY_MS = 24 * 60 * 60 * 1000

function seedHistory(): HistoryRecord[] {
  const now = Date.now()
  return [
    {
      id: 1,
      userId: 1,
      serviceId: 1,
      serviceName: 'Academic Advising',
      joinedAt: now - 5 * DAY_MS,
      endedAt: now - 5 * DAY_MS + 18 * 60 * 1000,
      waitMinutes: 18,
      outcome: 'served',
    },
    {
      id: 2,
      userId: 1,
      serviceId: 2,
      serviceName: 'Financial Aid',
      joinedAt: now - 3 * DAY_MS,
      endedAt: now - 3 * DAY_MS + 10 * 60 * 1000,
      waitMinutes: 10,
      outcome: 'left',
    },
    {
      id: 3,
      userId: 1,
      serviceId: 3,
      serviceName: 'IT Help Desk',
      joinedAt: now - 1 * DAY_MS,
      endedAt: now - 1 * DAY_MS + 12 * 60 * 1000,
      waitMinutes: 12,
      outcome: 'served',
    },
  ]
}

// A couple of notifications for the seeded student (id 1) so the notifications
// UI shows real backend data before the queue module starts triggering live
// ones (via the notify* helpers in the notifications module).
function seedNotifications(): Notification[] {
  const now = Date.now()
  return [
    {
      id: 1,
      userId: 1,
      type: 'joined',
      message: 'You joined the queue for Academic Advising.',
      createdAt: now - 12 * 60 * 1000,
      read: true,
    },
    {
      id: 2,
      userId: 1,
      type: 'almost-up',
      message: 'You are almost up for Academic Advising. Please be ready.',
      createdAt: now - 2 * 60 * 1000,
      read: false,
    },
  ]
}

/**
 * Restores the store to its seeded state. Every test file must call this in
 * `beforeEach` - in-memory state is shared across tests in a file and one
 * leftover queue entry will silently break an unrelated assertion.
 */
export function resetStore(): void {
  store.users = seedUsers()
  store.services = seedServices()
  store.queueEntries = []
  store.history = seedHistory()
  store.notifications = seedNotifications()
  store.sessions = new Map()

  counters.users = store.users.length
  counters.services = store.services.length
  counters.queueEntries = 0
  counters.history = store.history.length
  counters.notifications = store.notifications.length
}

resetStore()
