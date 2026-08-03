import { ApiError } from "../../errors";
import {
  nextId,
  store,
  type EntryPriority,
  type QueueEntry,
  type Service,
} from "../../store/memoryStore";
import { validateOrThrow, type Schema } from "../../validation/validators";

export const ENTRY_PRIORITIES = ["normal", "priority"] as const;

export const joinQueueSchema: Schema = {
  priority: {
    required: false,
    type: "string",
    oneOf: ENTRY_PRIORITIES,
    label: "Queue priority",
  },
};

export interface JoinQueueInput {
  priority?: EntryPriority;
}
// Ngoc Nguyen's work
// This file handles the service queue.
// It can add users, remove users, show the queue,
// check the user's position, and serve the next user.
export interface QueueEntryWithWaitTime extends QueueEntry {
  position: number;
  estimatedWaitMinutes: number;
}

function getServiceById(serviceId: number): Service {
  const service = store.services.find((service) => service.id === serviceId);

  if (!service) {
    throw ApiError.notFound(`No service found with id ${serviceId}.`);
  }

  return service;
}

function getUserById(userId: number) {
  const user = store.users.find((user) => user.id === userId);

  if (!user) {
    throw ApiError.notFound(`No user found with id ${userId}.`);
  }

  return user;
}

function getQueueEntryIndex(serviceId: number, userId: number): number {
  return store.queueEntries.findIndex(
    (entry) => entry.serviceId === serviceId && entry.userId === userId,
  );
}

export function estimateWaitTime(
  position: number,
  serviceDuration: number,
): number {
  return position * serviceDuration;
}

export function compareQueueEntries(
  first: QueueEntry,
  second: QueueEntry,
): number {
  if (first.priority !== second.priority) {
    if (first.priority === "priority") {
      return -1;
    }

    return 1;
  }

  if (first.joinedAt !== second.joinedAt) {
    return first.joinedAt - second.joinedAt;
  }

  return first.id - second.id;
}

export function listQueue(serviceId: number): QueueEntryWithWaitTime[] {
  const service = getServiceById(serviceId);

  const queueEntries = store.queueEntries
    .filter((entry) => entry.serviceId === serviceId)
    .sort(compareQueueEntries);

  return queueEntries.map((entry, index) => {
    const position = index + 1;

    return {
      ...entry,
      position,
      estimatedWaitMinutes: estimateWaitTime(position, service.duration),
    };
  });
}
export function joinQueue(
  serviceId: number,
  userId: number,
  input: unknown = {},
): QueueEntryWithWaitTime {
  const requestData = input ?? {};

  validateOrThrow(requestData, joinQueueSchema);

  const data = requestData as JoinQueueInput;
  const service = getServiceById(serviceId);
  const user = getUserById(userId);

  if (service.status !== "open") {
    throw ApiError.conflict(`${service.name} is currently closed.`);
  }

  const existingEntryIndex = getQueueEntryIndex(serviceId, userId);

  if (existingEntryIndex !== -1) {
    throw ApiError.conflict("You are already waiting in this queue.");
  }

  const newEntry: QueueEntry = {
    id: nextId("queueEntries"),
    serviceId,
    userId,
    name: user.name,
    email: user.email,
    priority: data.priority ?? "normal",
    joinedAt: Date.now(),
  };

  store.queueEntries.push(newEntry);

  const updatedQueue = listQueue(serviceId);

  const joinedEntry = updatedQueue.find((entry) => entry.id === newEntry.id);

  if (!joinedEntry) {
    throw new Error("The new queue entry could not be found.");
  }

  return joinedEntry;
}

export function leaveQueue(serviceId: number, userId: number): QueueEntry {
  getServiceById(serviceId);

  const entryIndex = getQueueEntryIndex(serviceId, userId);

  if (entryIndex === -1) {
    throw ApiError.notFound("You are not currently waiting in this queue.");
  }

  const removedEntry = store.queueEntries.splice(entryIndex, 1)[0];

  if (!removedEntry) {
    throw new Error("The queue entry could not be removed.");
  }

  return removedEntry;
}

export function getUserQueueStatus(
  serviceId: number,
  userId: number,
): QueueEntryWithWaitTime {
  const queue = listQueue(serviceId);

  const userEntry = queue.find((entry) => entry.userId === userId);

  if (!userEntry) {
    throw ApiError.notFound("You are not currently waiting in this queue.");
  }

  return userEntry;
}

export function serveNext(serviceId: number): QueueEntryWithWaitTime {
  const queue = listQueue(serviceId);
  const nextEntry = queue[0];

  if (!nextEntry) {
    throw ApiError.notFound("There is nobody waiting in this queue.");
  }

  const entryIndex = store.queueEntries.findIndex(
    (entry) => entry.id === nextEntry.id,
  );

  if (entryIndex === -1) {
    throw new Error("The next queue entry could not be found.");
  }

  store.queueEntries.splice(entryIndex, 1);

  return nextEntry;
}
