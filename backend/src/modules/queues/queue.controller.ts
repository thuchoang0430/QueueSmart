import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  QueueEntryPriority,
  type QueueEntryStatus,
} from "../../generated/prisma/client";
import { ApiError } from "../../errors";
import { parseId } from "../../validation/validators";

import {
  getUserQueueStatus,
  joinQueue,
  leaveQueue,
  listQueue,
  serveNext as serveNextFromQueue,
  type QueueEntryWithWaitTime,
} from "./queue.service";

type ApiQueuePriority = "normal" | "priority";

interface QueueEntryResponse {
  id: number;
  serviceId: number;
  userId: number;
  name: string;
  email: string;
  priority: ApiQueuePriority;
  joinedAt: number;
  position: number;
  status: QueueEntryStatus;
  estimatedWaitMinutes: number;
}

function getAuthenticatedUserId(req: Request): number {
  if (!req.user) {
    throw ApiError.unauthorized(
      "You must be signed in to access the queue.",
    );
  }

  return req.user.id;
}

function toApiPriority(
  priority: QueueEntryPriority,
): ApiQueuePriority {
  return priority === QueueEntryPriority.PRIORITY
    ? "priority"
    : "normal";
}

function toQueueEntryResponse(
  serviceId: number,
  entry: QueueEntryWithWaitTime,
): QueueEntryResponse {
  return {
    id: entry.id,
    serviceId,
    userId: entry.userId,
    name:
      entry.user.profile?.fullName ??
      entry.user.email,
    email: entry.user.email,
    priority: toApiPriority(entry.priority),
    joinedAt: entry.joinTime.getTime(),
    position: entry.position,
    status: entry.status,
    estimatedWaitMinutes:
      entry.estimatedWaitMinutes,
  };
}

export async function postJoinQueue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const serviceId = parseId(
      String(req.params.serviceId),
      "Service id",
    );

    const userId = getAuthenticatedUserId(req);

    const entry = await joinQueue(
      serviceId,
      userId,
      req.body,
    );

    res.status(201).json({
      message: "You successfully joined the queue.",
      entry: toQueueEntryResponse(
        serviceId,
        entry,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteLeaveQueue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const serviceId = parseId(
      String(req.params.serviceId),
      "Service id",
    );

    const userId = getAuthenticatedUserId(req);

    const entry = await leaveQueue(
      serviceId,
      userId,
    );

    res.json({
      message: "You successfully left the queue.",
      entry: toQueueEntryResponse(
        serviceId,
        entry,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyQueueStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const serviceId = parseId(
      String(req.params.serviceId),
      "Service id",
    );

    const userId = getAuthenticatedUserId(req);

    const entry = await getUserQueueStatus(
      serviceId,
      userId,
    );

    res.json({
      entry: toQueueEntryResponse(
        serviceId,
        entry,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function getQueue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const serviceId = parseId(
      String(req.params.serviceId),
      "Service id",
    );

    const entries = await listQueue(serviceId);

    const queue = entries.map((entry) =>
      toQueueEntryResponse(
        serviceId,
        entry,
      ),
    );

    res.json({
      queue,
      total: queue.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function postServeNext(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const serviceId = parseId(
      String(req.params.serviceId),
      "Service id",
    );

    const servedEntry =
      await serveNextFromQueue(serviceId);

    res.json({
      message:
        "The next user is now being served.",
      servedEntry: toQueueEntryResponse(
        serviceId,
        servedEntry,
      ),
    });
  } catch (error) {
    next(error);
  }
}
