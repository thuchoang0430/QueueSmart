import {
  HistoryOutcome,
  Prisma,
  QueueEntryPriority,
  QueueEntryStatus,
  QueueStatus,
} from "../../generated/prisma/client";
import { prisma } from "../../database/prisma";
import { ApiError } from "../../errors";
import { recordHistory } from "../history/history.service";
import {
  notifyAlmostServed,
  notifyQueueJoined,
  notifyServed,
} from "../notifications/notifications.service";
import { validateOrThrow, type Schema } from "../../validation/validators";

export const ENTRY_PRIORITIES = ["normal", "priority"] as const;

export type EntryPriority = (typeof ENTRY_PRIORITIES)[number];

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

export interface QueueEntryWithWaitTime {
  id: number;
  queueId: number;
  userId: number;
  position: number;
  joinTime: Date;
  status: QueueEntryStatus;
  priority: QueueEntryPriority;
  estimatedWaitMinutes: number;
  user: {
    id: number;
    email: string;
    profile: {
      fullName: string;
    } | null;
  };
}

function toDatabasePriority(
  priority: EntryPriority | undefined,
): QueueEntryPriority {
  if (priority === "priority") {
    return QueueEntryPriority.PRIORITY;
  }

  return QueueEntryPriority.NORMAL;
}
export function estimateWaitTime(
  position: number,
  expectedDuration: number,
): number {
  return Math.max(0, position - 1) * expectedDuration;
}

export const MIN_HISTORY_SAMPLES = 3;

export function estimateSmartWaitTime(
  position: number,
  expectedDuration: number,
  historicalWaitMinutes: number[],
): number {
  const fallbackWait = estimateWaitTime(position, expectedDuration);

  if (position <= 1) {
    return 0;
  }

  const validHistory = historicalWaitMinutes.filter(
    (wait) => Number.isFinite(wait) && wait >= 0,
  );

  if (validHistory.length < MIN_HISTORY_SAMPLES) {
    return fallbackWait;
  }

  const historicalAverage =
    validHistory.reduce((sum, wait) => sum + wait, 0) / validHistory.length;

  const smartEstimate = fallbackWait * 0.6 + historicalAverage * 0.4;

  return Math.max(0, Math.round(smartEstimate));
}

async function getHistoricalWaitMinutes(serviceId: number): Promise<number[]> {
  const history = await prisma.history.findMany({
    where: {
      serviceId,
      outcome: HistoryOutcome.SERVED,
    },
    orderBy: {
      endedAt: "desc",
    },
    take: 20,
    select: {
      waitMinutes: true,
    },
  });

  return history.map((record) => record.waitMinutes);
}
async function findQueueByServiceId(
  serviceId: number,
  transaction: Prisma.TransactionClient = prisma,
) {
  const service = await transaction.service.findUnique({
    where: {
      id: serviceId,
    },
    include: {
      queues: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!service) {
    throw ApiError.notFound(`No service found with id ${serviceId}.`);
  }

  const queue = service.queues[0];

  if (!queue) {
    throw ApiError.notFound(`No queue found for service id ${serviceId}.`);
  }

  return {
    service,
    queue,
  };
}

async function reorderQueueEntries(
  queueId: number,
  transaction: Prisma.TransactionClient = prisma,
): Promise<void> {
  const entries = await transaction.queueEntry.findMany({
    where: {
      queueId,
      status: QueueEntryStatus.WAITING,
    },
    orderBy: [
      {
        priority: "desc",
      },
      {
        joinTime: "asc",
      },
      {
        id: "asc",
      },
    ],
    select: {
      id: true,
    },
  });

  await Promise.all(
    entries.map((entry, index) =>
      transaction.queueEntry.update({
        where: {
          id: entry.id,
        },
        data: {
          position: index + 1,
        },
      }),
    ),
  );
}

export async function listQueue(
  serviceId: number,
): Promise<QueueEntryWithWaitTime[]> {
  const { service, queue } = await findQueueByServiceId(serviceId);

  const entries = await prisma.queueEntry.findMany({
    where: {
      queueId: queue.id,
      status: QueueEntryStatus.WAITING,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        position: "asc",
      },
      {
        joinTime: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  const historicalWaitMinutes = await getHistoricalWaitMinutes(serviceId);

  return entries.map((entry) => ({
    ...entry,
    estimatedWaitMinutes: estimateSmartWaitTime(
      entry.position,
      service.expectedDuration,
      historicalWaitMinutes,
    ),
  }));
}

export async function joinQueue(
  serviceId: number,
  userId: number,
  input: unknown = {},
): Promise<QueueEntryWithWaitTime> {
  validateOrThrow(input ?? {}, joinQueueSchema);

  const data = (input ?? {}) as JoinQueueInput;

  const result = await prisma.$transaction(async (transaction) => {
    const { service, queue } = await findQueueByServiceId(
      serviceId,
      transaction,
    );

    if (queue.status !== QueueStatus.OPEN) {
      throw ApiError.conflict(`${service.name} queue is currently closed.`);
    }

    const user = await transaction.userCredential.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw ApiError.notFound(`No user found with id ${userId}.`);
    }

    const existingEntry = await transaction.queueEntry.findFirst({
      where: {
        queueId: queue.id,
        userId,
        status: QueueEntryStatus.WAITING,
      },
    });

    if (existingEntry) {
      throw ApiError.conflict("You are already waiting in this queue.");
    }

    const waitingCount = await transaction.queueEntry.count({
      where: {
        queueId: queue.id,
        status: QueueEntryStatus.WAITING,
      },
    });

    const entry = await transaction.queueEntry.create({
      data: {
        queueId: queue.id,
        userId,
        position: waitingCount + 1,
        priority: toDatabasePriority(data.priority),
        status: QueueEntryStatus.WAITING,
      },
    });

    await reorderQueueEntries(queue.id, transaction);

    return {
      entryId: entry.id,
      expectedDuration: service.expectedDuration,
      serviceName: service.name,
    };
  });

  const entry = await prisma.queueEntry.findUnique({
    where: {
      id: result.entryId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!entry) {
    throw new Error("The new queue entry could not be retrieved.");
  }

  await notifyQueueJoined(userId, result.serviceName);

  const historicalWaitMinutes = await getHistoricalWaitMinutes(serviceId);

  return {
    ...entry,
    estimatedWaitMinutes: estimateSmartWaitTime(
      entry.position,
      result.expectedDuration,
      historicalWaitMinutes,
    ),
  };
}

export async function leaveQueue(
  serviceId: number,
  userId: number,
): Promise<QueueEntryWithWaitTime> {
  const result = await prisma.$transaction(async (transaction) => {
    const { service, queue } = await findQueueByServiceId(
      serviceId,
      transaction,
    );

    const entry = await transaction.queueEntry.findFirst({
      where: {
        queueId: queue.id,
        userId,
        status: QueueEntryStatus.WAITING,
      },
    });

    if (!entry) {
      throw ApiError.notFound("You are not currently waiting in this queue.");
    }

    const canceledEntry = await transaction.queueEntry.update({
      where: {
        id: entry.id,
      },
      data: {
        status: QueueEntryStatus.CANCELED,
        position: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    await reorderQueueEntries(queue.id, transaction);

    return {
      entry: canceledEntry,
      serviceName: service.name,
    };
  });

  await recordHistory({
    userId: result.entry.userId,
    serviceId,
    serviceName: result.serviceName,
    joinedAt: result.entry.joinTime.getTime(),
    outcome: "left",
  });

  return {
    ...result.entry,
    estimatedWaitMinutes: 0,
  };
}

export async function getUserQueueStatus(
  serviceId: number,
  userId: number,
): Promise<QueueEntryWithWaitTime> {
  const { service, queue } = await findQueueByServiceId(serviceId);

  const entry = await prisma.queueEntry.findFirst({
    where: {
      queueId: queue.id,
      userId,
      status: QueueEntryStatus.WAITING,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!entry) {
    throw ApiError.notFound("You are not currently waiting in this queue.");
  }

  const historicalWaitMinutes = await getHistoricalWaitMinutes(serviceId);

  return {
    ...entry,
    estimatedWaitMinutes: estimateSmartWaitTime(
      entry.position,
      service.expectedDuration,
      historicalWaitMinutes,
    ),
  };
}

export async function serveNext(
  serviceId: number,
): Promise<QueueEntryWithWaitTime> {
  const result = await prisma.$transaction(async (transaction) => {
    const { service, queue } = await findQueueByServiceId(
      serviceId,
      transaction,
    );

    const nextEntry = await transaction.queueEntry.findFirst({
      where: {
        queueId: queue.id,
        status: QueueEntryStatus.WAITING,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          position: "asc",
        },
        {
          joinTime: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    if (!nextEntry) {
      throw ApiError.notFound("There is nobody waiting in this queue.");
    }

    await transaction.queueEntry.update({
      where: {
        id: nextEntry.id,
      },
      data: {
        status: QueueEntryStatus.SERVED,
        position: 0,
      },
    });

    await reorderQueueEntries(queue.id, transaction);

    return {
      entry: nextEntry,
      expectedDuration: service.expectedDuration,
      serviceName: service.name,
      queueId: queue.id,
    };
  });

  await recordHistory({
    userId: result.entry.userId,
    serviceId,
    serviceName: result.serviceName,
    joinedAt: result.entry.joinTime.getTime(),
    outcome: "served",
  });

  await notifyServed(result.entry.userId, result.serviceName);

  const nextWaiting = await prisma.queueEntry.findFirst({
    where: {
      queueId: result.queueId,
      status: QueueEntryStatus.WAITING,
    },
    orderBy: {
      position: "asc",
    },
  });

  if (nextWaiting) {
    await notifyAlmostServed(nextWaiting.userId, result.serviceName);
  }

  return {
    ...result.entry,
    status: QueueEntryStatus.SERVED,
    position: 0,
    estimatedWaitMinutes: 0,
  };
}
