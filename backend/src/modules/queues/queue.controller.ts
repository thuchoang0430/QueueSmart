import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../../errors";
import { parseId } from "../../validation/validators";

import {
  getUserQueueStatus,
  joinQueue,
  leaveQueue,
  listQueue,
  serveNext,
} from "./queue.service";

// Get the current user's ID.
// Show an unauthorized error if the user is not logged in.

function getUserId(req: Request): number {
  if (!req.user) {
    throw ApiError.unauthorized("You must be signed in to access the queue.");
  }

  return req.user.id;
}

// Get the service ID from the URL and check if it is valid.

function getServiceId(req: Request): number {
  return parseId(String(req.params.serviceId), "Service id");
}

//  * Add the logged-in user to a service queue.

export function postJoinQueue(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const serviceId = getServiceId(req);
    const userId = getUserId(req);

    const entry = joinQueue(serviceId, userId, req.body);

    res.status(201).json({
      message: "You successfully joined the queue.",
      entry,
    });
  } catch (error) {
    next(error);
  }
}

//  * Remove the logged-in user from a service queue.

export function deleteLeaveQueue(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const serviceId = getServiceId(req);
    const userId = getUserId(req);

    const entry = leaveQueue(serviceId, userId);

    res.json({
      message: "You successfully left the queue.",
      entry,
    });
  } catch (error) {
    next(error);
  }
}

//  * Return the logged-in user's current queue status.

export function getMyQueueStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const serviceId = getServiceId(req);
    const userId = getUserId(req);

    const entry = getUserQueueStatus(serviceId, userId);

    res.json({
      entry,
    });
  } catch (error) {
    next(error);
  }
}

export function getQueue(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const serviceId = getServiceId(req);
    const queue = listQueue(serviceId);

    res.json({
      queue,
      total: queue.length,
    });
  } catch (error) {
    next(error);
  }
}

//  * Remove the next person from the waiting queue
//  * and mark that person as being served.

export function postServeNext(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const serviceId = getServiceId(req);
    const servedEntry = serveNext(serviceId);

    res.json({
      message: `${servedEntry.name} is now being served.`,
      servedEntry,
    });
  } catch (error) {
    next(error);
  }
}
