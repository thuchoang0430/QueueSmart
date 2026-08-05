import {
  Prisma,
  QueueEntryPriority,
  QueueEntryStatus,
  QueueStatus,
} from "../../generated/prisma/client";
import { prisma } from "../../database/prisma";
import { ApiError } from "../../errors";
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
  return priority === "priority"
    ? QueueEntryPriority.PRIORITY
    : QueueEntryPriority.NORMAL;
}

export function estimateWaitTime(
  position: number,
  expectedDuration: number,
): number {
  return Math.max(0, position - 1) * expectedDuration;
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
    entries.map((entry: { id: number }, index: number) =>
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
  queueId: number,
): Promise<QueueEntryWithWaitTime[]> {
  const queue = await prisma.queue.findUnique({
    where: {
      id: queueId,
    },
    include: {
      service: true,
    },
  });

  if (!queue) {
    throw ApiError.notFound(`No queue found with id ${queueId}.`);
  }

  const entries = await prisma.queueEntry.findMany({
    where: {
      queueId,
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

  return entries.map((entry) => ({
    ...entry,
    estimatedWaitMinutes: estimateWaitTime(
      entry.position,
      queue.service.expectedDuration,
    ),
  }));
}

export async function joinQueue(
  queueId: number,
  userId: number,
  input: unknown = {},
): Promise<QueueEntryWithWaitTime> {
  validateOrThrow(input ?? {}, joinQueueSchema);

  const data = (input ?? {}) as JoinQueueInput;

  const result = await prisma.$transaction(async (tx) => {
    const queue = await tx.queue.findUnique({
      where: {
        id: queueId,
      },
      include: {
        service: true,
      },
    });

    if (!queue) {
      throw ApiError.notFound(`No queue found with id ${queueId}.`);
    }

    if (queue.status !== QueueStatus.OPEN) {
      throw ApiError.conflict(
        `${queue.service.name} queue is currently closed.`,
      );
    }

    const user = await tx.userCredential.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw ApiError.notFound(`No user found with id ${userId}.`);
    }

    const existingEntry = await tx.queueEntry.findFirst({
      where: {
        queueId,
        userId,
        status: QueueEntryStatus.WAITING,
      },
    });

    if (existingEntry) {
      throw ApiError.conflict("You are already waiting in this queue.");
    }

    const waitingCount = await tx.queueEntry.count({
      where: {
        queueId,
        status: QueueEntryStatus.WAITING,
      },
    });

    const entry = await tx.queueEntry.create({
      data: {
        queueId,
        userId,
        position: waitingCount + 1,
        priority: toDatabasePriority(data.priority),
        status: QueueEntryStatus.WAITING,
      },
    });

    await reorderQueueEntries(queueId, tx);

    return {
      entryId: entry.id,
      expectedDuration: queue.service.expectedDuration,
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

  return {
    ...entry,
    estimatedWaitMinutes: estimateWaitTime(
      entry.position,
      result.expectedDuration,
    ),
  };
}

export async function leaveQueue(queueId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.queueEntry.findFirst({
      where: {
        queueId,
        userId,
        status: QueueEntryStatus.WAITING,
      },
    });

    if (!entry) {
      throw ApiError.notFound("You are not currently waiting in this queue.");
    }

    const canceledEntry = await tx.queueEntry.update({
      where: {
        id: entry.id,
      },
      data: {
        status: QueueEntryStatus.CANCELED,
        position: 0,
      },
    });

    await reorderQueueEntries(queueId, tx);

    return canceledEntry;
  });
}

export async function getUserQueueStatus(
  queueId: number,
  userId: number,
): Promise<QueueEntryWithWaitTime> {
  const queue = await prisma.queue.findUnique({
    where: {
      id: queueId,
    },
    include: {
      service: true,
    },
  });

  if (!queue) {
    throw ApiError.notFound(`No queue found with id ${queueId}.`);
  }

  const entry = await prisma.queueEntry.findFirst({
    where: {
      queueId,
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

  return {
    ...entry,
    estimatedWaitMinutes: estimateWaitTime(
      entry.position,
      queue.service.expectedDuration,
    ),
  };
}

export async function serveNext(
  queueId: number,
): Promise<QueueEntryWithWaitTime> {
  const result = await prisma.$transaction(async (tx) => {
    const queue = await tx.queue.findUnique({
      where: {
        id: queueId,
      },
      include: {
        service: true,
      },
    });

    if (!queue) {
      throw ApiError.notFound(`No queue found with id ${queueId}.`);
    }

    const nextEntry = await tx.queueEntry.findFirst({
      where: {
        queueId,
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

    await tx.queueEntry.update({
      where: {
        id: nextEntry.id,
      },
      data: {
        status: QueueEntryStatus.SERVED,
        position: 0,
      },
    });

    await reorderQueueEntries(queueId, tx);

    return {
      entry: nextEntry,
      expectedDuration: queue.service.expectedDuration,
    };
  });

  return {
    ...result.entry,
    status: QueueEntryStatus.SERVED,
    position: 0,
    estimatedWaitMinutes: estimateWaitTime(
      result.entry.position,
      result.expectedDuration,
    ),
  };
}
