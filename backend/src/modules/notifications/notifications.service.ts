import {
  NotificationType as DatabaseNotificationType,
  type Notification as DatabaseNotification,
} from "../../generated/prisma/client";
import { prisma } from "../../database/prisma";

export type NotificationType =
  | "joined"
  | "almost-up"
  | "served";

export interface NotificationRecord {
  id: number;
  userId: number;
  type: NotificationType;
  message: string;
  createdAt: number;
  read: boolean;
}

export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  message: string;
}

function toDatabaseType(
  type: NotificationType,
): DatabaseNotificationType {
  switch (type) {
    case "joined":
      return DatabaseNotificationType.JOINED;
    case "almost-up":
      return DatabaseNotificationType.ALMOST_UP;
    case "served":
      return DatabaseNotificationType.SERVED;
  }
}

function fromDatabaseType(
  type: DatabaseNotificationType,
): NotificationType {
  switch (type) {
    case DatabaseNotificationType.JOINED:
      return "joined";
    case DatabaseNotificationType.ALMOST_UP:
      return "almost-up";
    case DatabaseNotificationType.SERVED:
      return "served";
  }
}

function toNotificationRecord(
  notification: DatabaseNotification,
): NotificationRecord {
  return {
    id: notification.id,
    userId: notification.userId,
    type: fromDatabaseType(notification.type),
    message: notification.message,
    createdAt: notification.createdAt.getTime(),
    read: notification.read,
  };
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationRecord> {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: toDatabaseType(input.type),
      message: input.message,
    },
  });

  return toNotificationRecord(notification);
}

export async function notifyQueueJoined(
  userId: number,
  serviceName: string,
): Promise<NotificationRecord> {
  return createNotification({
    userId,
    type: "joined",
    message: `You joined the queue for ${serviceName}.`,
  });
}

export async function notifyAlmostServed(
  userId: number,
  serviceName: string,
): Promise<NotificationRecord> {
  return createNotification({
    userId,
    type: "almost-up",
    message: `You are almost up for ${serviceName}. Please be ready.`,
  });
}

export async function notifyServed(
  userId: number,
  serviceName: string,
): Promise<NotificationRecord> {
  return createNotification({
    userId,
    type: "served",
    message: `You have been served for ${serviceName}.`,
  });
}

export async function getUserNotifications(
  userId: number,
): Promise<NotificationRecord[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return notifications.map(toNotificationRecord);
}

export async function unreadCount(
  userId: number,
): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

export async function markAllRead(
  userId: number,
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  return result.count;
}
