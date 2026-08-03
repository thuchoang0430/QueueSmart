import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../../errors";
import { parseId } from "../../validation/validators";

import {
  getUserQueueStatus,
  joinQueue,
  leaveQueue,
  listQueue,
  serveNext as serveNextFromQueue,
} from "./queue.service";

function getAuthenticatedUserId(req: Request): number {
  if (!req.user) {
    throw ApiError.unauthorized("You must be signed in to access the queue.");
  }

  return req.user.id;
}

export async function postJoinQueue(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const serviceId = parseId(String(req.params.serviceId), "Service id");

    const userId = getAuthenticatedUserId(req);

    const entry = joinQueue(serviceId, userId, req.body);

    res.status(201).json({
      message: "You successfully joined the queue.",
      entry,
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
    const serviceId = parseId(String(req.params.serviceId), "Service id");

    const userId = getAuthenticatedUserId(req);

    const entry = leaveQueue(serviceId, userId);

    res.json({
      message: "You successfully left the queue.",
      entry,
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
    const serviceId = parseId(String(req.params.serviceId), "Service id");

    const userId = getAuthenticatedUserId(req);

    const entry = getUserQueueStatus(serviceId, userId);

    res.json({
      entry,
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
    const serviceId = parseId(String(req.params.serviceId), "Service id");

    const queue = listQueue(serviceId);

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
    const serviceId = parseId(String(req.params.serviceId), "Service id");

    const servedEntry = serveNextFromQueue(serviceId);

    res.json({
      message: `${servedEntry.name} is now being served.`,
      servedEntry,
    });
  } catch (error) {
    next(error);
  }
}
