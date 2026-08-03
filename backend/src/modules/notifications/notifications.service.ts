import {
  nextId,
  store,
  type Notification,
  type NotificationType,
} from '../../store/memoryStore'

// Notification module for A3. Backend-only: notifications are created by events
// (joining a queue, being close to served) and read back by the front end. No
// real email or SMS is sent - the message is logged to the store and returned
// to the UI, which is all A3 requires.
//
// Read side: getUserNotifications / unreadCount power the notifications UI.
// Write side: the notify* helpers are called by the queue module when queue
// state changes.

export interface CreateNotificationInput {
  userId: number
  type: NotificationType
  message: string
}

/** Low-level create. Prefer the notify* helpers for the standard events. */
export function createNotification(input: CreateNotificationInput): Notification {
  const notification: Notification = {
    id: nextId('notifications'),
    userId: input.userId,
    type: input.type,
    message: input.message,
    createdAt: Date.now(),
    read: false,
  }

  store.notifications.push(notification)
  return notification
}

/** Fired when a user joins a queue. */
export function notifyQueueJoined(userId: number, serviceName: string): Notification {
  return createNotification({
    userId,
    type: 'joined',
    message: `You joined the queue for ${serviceName}.`,
  })
}

/** Fired when a user is close to the front of the queue. */
export function notifyAlmostServed(userId: number, serviceName: string): Notification {
  return createNotification({
    userId,
    type: 'almost-up',
    message: `You are almost up for ${serviceName}. Please be ready.`,
  })
}

/** Fired when a user has been served. */
export function notifyServed(userId: number, serviceName: string): Notification {
  return createNotification({
    userId,
    type: 'served',
    message: `You have been served for ${serviceName}.`,
  })
}

/** Returns one user's notifications, most recent first. */
export function getUserNotifications(userId: number): Notification[] {
  return store.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** How many of a user's notifications are unread. */
export function unreadCount(userId: number): number {
  return store.notifications.filter((n) => n.userId === userId && !n.read).length
}

/** Marks every notification for a user as read. Returns how many changed. */
export function markAllRead(userId: number): number {
  let updated = 0
  for (const n of store.notifications) {
    if (n.userId === userId && !n.read) {
      n.read = true
      updated++
    }
  }
  return updated
}
