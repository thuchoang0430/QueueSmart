import { ApiError } from "../../errors";
import { recordHistory } from "../history/history.service";
import {
  notifyAlmostServed,
  notifyQueueJoined,
  notifyServed,
} from "../notifications/notifications.service";
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

export interface QueueEntryWithWaitTime extends QueueEntry {
  position: number;
  estimatedWaitMinutes: number;
}

function findService(serviceId: number): Service {
  const service = store.services.find((item) => item.id === serviceId);

  if (!service) {
    throw ApiError.notFound(`No service found with id ${serviceId}.`);
  }

  return service;
}

export function estimateWaitTime(
  position: number,
  expectedDuration: number,
): number {
  return Math.max(0, position - 1) * expectedDuration;
}

export function compareQueueEntries(
  firstEntry: QueueEntry,
  secondEntry: QueueEntry,
): number {
  if (firstEntry.priority !== secondEntry.priority) {
    return firstEntry.priority === "priority" ? -1 : 1;
  }

  const arrivalDifference = firstEntry.joinedAt - secondEntry.joinedAt;

  if (arrivalDifference !== 0) {
    return arrivalDifference;
  }

  return firstEntry.id - secondEntry.id;
}

export function listQueue(serviceId: number): QueueEntryWithWaitTime[] {
  const service = findService(serviceId);

  const orderedQueue = store.queueEntries
    .filter((entry) => entry.serviceId === serviceId)
    .sort(compareQueueEntries);

  return orderedQueue.map((entry, index) => {
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
  validateOrThrow(input ?? {}, joinQueueSchema);

  const data = (input ?? {}) as JoinQueueInput;
  const service = findService(serviceId);

  if (service.status !== "open") {
    throw ApiError.conflict(`${service.name} is currently closed.`);
  }

  const user = store.users.find((item) => item.id === userId);

  if (!user) {
    throw ApiError.notFound(`No user found with id ${userId}.`);
  }

  const existingEntry = store.queueEntries.find(
    (entry) => entry.serviceId === serviceId && entry.userId === userId,
  );

  if (existingEntry) {
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

  notifyQueueJoined(userId, service.name);

  const joinedEntry = listQueue(serviceId).find(
    (entry) => entry.id === newEntry.id,
  );

  if (!joinedEntry) {
    throw new Error("The new queue entry could not be found.");
  }

  return joinedEntry;
}

export function leaveQueue(serviceId: number, userId: number): QueueEntry {
  const service = findService(serviceId);

  const entryIndex = store.queueEntries.findIndex(
    (entry) => entry.serviceId === serviceId && entry.userId === userId,
  );

  if (entryIndex === -1) {
    throw ApiError.notFound("You are not currently waiting in this queue.");
  }

  const removedEntries = store.queueEntries.splice(entryIndex, 1);
  const removedEntry = removedEntries[0];

  if (!removedEntry) {
    throw new Error("The queue entry could not be removed.");
  }

  recordHistory({
    userId: removedEntry.userId,
    serviceId: removedEntry.serviceId,
    serviceName: service.name,
    joinedAt: removedEntry.joinedAt,
    outcome: "left",
  });

  return removedEntry;
}

export function getUserQueueStatus(
  serviceId: number,
  userId: number,
): QueueEntryWithWaitTime {
  const queue = listQueue(serviceId);

  const entry = queue.find((item) => item.userId === userId);

  if (!entry) {
    throw ApiError.notFound("You are not currently waiting in this queue.");
  }

  return entry;
}

export function serveNext(serviceId: number): QueueEntryWithWaitTime {
  const service = findService(serviceId);
  const queue = listQueue(serviceId);
  const nextUser = queue[0];

  if (!nextUser) {
    throw ApiError.notFound("There is nobody waiting in this queue.");
  }

  const entryIndex = store.queueEntries.findIndex(
    (entry) => entry.id === nextUser.id,
  );

  if (entryIndex === -1) {
    throw new Error("The next queue entry could not be found.");
  }

  store.queueEntries.splice(entryIndex, 1);

  recordHistory({
    userId: nextUser.userId,
    serviceId: nextUser.serviceId,
    serviceName: service.name,
    joinedAt: nextUser.joinedAt,
    outcome: "served",
  });

  notifyServed(nextUser.userId, service.name);

  const updatedQueue = listQueue(serviceId);
  const newFirstEntry = updatedQueue[0];

  if (newFirstEntry) {
    notifyAlmostServed(newFirstEntry.userId, service.name);
  }

  return nextUser;
}
