import type { NextFunction, Request, Response } from 'express'
import { getUserNotifications, markAllRead, unreadCount } from './notifications.service'

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    // requireAuth guarantees req.user, so a user only sees their own
    // notifications - the id is never read from the request.
    const userId = req.user!.id
    res.json({
      notifications: getUserNotifications(userId),
      unreadCount: unreadCount(userId),
    })
  } catch (err) {
    next(err)
  }
}

export async function postMarkRead(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = markAllRead(req.user!.id)
    res.json({ updated })
  } catch (err) {
    next(err)
  }
}
