import type {
  NextFunction,
  Request,
  Response,
} from "express";
import {
  getUserNotifications,
  markAllRead,
  unreadCount,
} from "./notifications.service";

export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;

    const [notifications, unread] = await Promise.all([
      getUserNotifications(userId),
      unreadCount(userId),
    ]);

    res.json({
      notifications,
      unreadCount: unread,
    });
  } catch (error) {
    next(error);
  }
}

export async function postMarkRead(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const updated = await markAllRead(req.user!.id);

    res.json({
      updated,
    });
  } catch (error) {
    next(error);
  }
}
