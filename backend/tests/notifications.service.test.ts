import { beforeEach, describe, expect, it } from 'vitest'
import {
  createNotification,
  getUserNotifications,
  markAllRead,
  notifyAlmostServed,
  notifyQueueJoined,
  notifyServed,
  unreadCount,
} from '../src/modules/notifications/notifications.service'
import { resetStore, store } from '../src/store/memoryStore'

beforeEach(() => {
  resetStore()
})

describe('getUserNotifications', () => {
  it('returns the seeded notifications for the demo student', () => {
    expect(getUserNotifications(1)).toHaveLength(2)
  })

  it('returns nothing for a user with no notifications', () => {
    expect(getUserNotifications(2)).toEqual([])
  })

  it('orders notifications most recent first', () => {
    const list = getUserNotifications(1)
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].createdAt).toBeGreaterThanOrEqual(list[i].createdAt)
    }
  })

  it('only returns the given user’s notifications', () => {
    notifyQueueJoined(2, 'Financial Aid')
    expect(getUserNotifications(1)).toHaveLength(2)
    expect(getUserNotifications(2)).toHaveLength(1)
  })
})

describe('createNotification', () => {
  it('appends an unread notification with an id and timestamp', () => {
    const before = Date.now()
    const n = createNotification({ userId: 2, type: 'joined', message: 'Hello' })
    expect(n.id).toBeGreaterThan(0)
    expect(n.read).toBe(false)
    expect(n.createdAt).toBeGreaterThanOrEqual(before)
    expect(store.notifications).toHaveLength(3)
  })
})

describe('notify helpers', () => {
  it('notifyQueueJoined creates a joined notification naming the service', () => {
    const n = notifyQueueJoined(2, 'IT Help Desk')
    expect(n.type).toBe('joined')
    expect(n.message).toContain('IT Help Desk')
  })

  it('notifyAlmostServed creates an almost-up notification', () => {
    const n = notifyAlmostServed(2, 'IT Help Desk')
    expect(n.type).toBe('almost-up')
    expect(n.message).toContain('almost up')
  })

  it('notifyServed creates a served notification', () => {
    const n = notifyServed(2, 'IT Help Desk')
    expect(n.type).toBe('served')
    expect(n.message).toContain('served')
  })

  it('makes the new notification visible through getUserNotifications, newest first', () => {
    notifyQueueJoined(1, 'Financial Aid')
    const list = getUserNotifications(1)
    expect(list).toHaveLength(3)
    expect(list[0].message).toContain('Financial Aid')
  })
})

describe('unreadCount', () => {
  it('counts only unread notifications for the user', () => {
    // Seed for user 1: one read, one unread.
    expect(unreadCount(1)).toBe(1)
  })

  it('is zero for a user with no notifications', () => {
    expect(unreadCount(2)).toBe(0)
  })

  it('increases when a new notification is created', () => {
    notifyQueueJoined(1, 'Financial Aid')
    expect(unreadCount(1)).toBe(2)
  })
})

describe('markAllRead', () => {
  it('marks the user’s unread notifications read and returns the count changed', () => {
    expect(markAllRead(1)).toBe(1)
    expect(unreadCount(1)).toBe(0)
  })

  it('returns 0 when there is nothing unread', () => {
    markAllRead(1)
    expect(markAllRead(1)).toBe(0)
  })

  it('does not touch another user’s notifications', () => {
    notifyQueueJoined(2, 'Financial Aid')
    markAllRead(1)
    expect(unreadCount(2)).toBe(1)
  })
})
