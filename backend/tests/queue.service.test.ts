import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  QueueEntryPriority,
  QueueEntryStatus,
  QueueStatus,
  UserRole,
} from "../src/generated/prisma/client";
import { prisma } from "../src/database/prisma";

import {
  estimateWaitTime,
  getUserQueueStatus,
  joinQueue,
  leaveQueue,
  listQueue,
  serveNext,
} from "../src/modules/queues/queue.service";

let queueId: number;
let firstUserId: number;
let secondUserId: number;

async function clearTestData(): Promise<void> {
  await prisma.history.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.service.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.userCredential.deleteMany();
}

async function createTestUser(
  email: string,
  fullName: string,
): Promise<number> {
  const user = await prisma.userCredential.create({
    data: {
      email,
      passwordHash: "hashed-password",
      role: UserRole.USER,
      profile: {
        create: {
          fullName,
          email,
        },
      },
    },
  });

  return user.id;
}

beforeEach(async () => {
  await clearTestData();

  firstUserId = await createTestUser(
    "queue-user-one@test.com",
    "Queue User One",
  );

  secondUserId = await createTestUser(
    "queue-user-two@test.com",
    "Queue User Two",
  );

  const service = await prisma.service.create({
    data: {
      name: "Academic Advising",
      description: "Meet with an academic advisor.",
      expectedDuration: 20,
      priorityLevel: 1,
    },
  });

  const queue = await prisma.queue.create({
    data: {
      serviceId: service.id,
      status: QueueStatus.OPEN,
    },
  });

  queueId = queue.id;
});

afterAll(async () => {
  await clearTestData();
  await prisma.$disconnect();
});

describe("estimateWaitTime", () => {
  it("returns zero for the first user", () => {
    expect(estimateWaitTime(1, 20)).toBe(0);
  });

  it("returns one service duration for the second user", () => {
    expect(estimateWaitTime(2, 20)).toBe(20);
  });

  it("does not return a negative wait time", () => {
    expect(estimateWaitTime(0, 20)).toBe(0);
  });
});

describe("joinQueue", () => {
  it("persists a user in an open queue", async () => {
    const result = await joinQueue(queueId, firstUserId);

    expect(result).toMatchObject({
      userId: firstUserId,
      queueId,
      position: 1,
      status: QueueEntryStatus.WAITING,
      estimatedWaitMinutes: 0,
    });

    const savedEntry = await prisma.queueEntry.findFirst({
      where: {
        queueId,
        userId: firstUserId,
      },
    });

    expect(savedEntry).not.toBeNull();
    expect(savedEntry?.status).toBe(QueueEntryStatus.WAITING);
  });

  it("prevents duplicate waiting entries", async () => {
    await joinQueue(queueId, firstUserId);

    await expect(joinQueue(queueId, firstUserId)).rejects.toThrow(
      "You are already waiting in this queue.",
    );
  });

  it("rejects joining a closed queue", async () => {
    await prisma.queue.update({
      where: {
        id: queueId,
      },
      data: {
        status: QueueStatus.CLOSED,
      },
    });

    await expect(joinQueue(queueId, firstUserId)).rejects.toThrow(
      "Academic Advising queue is currently closed.",
    );
  });

  it("rejects an unknown user", async () => {
    const unknownUserId = 999_999;

    await expect(joinQueue(queueId, unknownUserId)).rejects.toThrow(
      "No user found",
    );
  });
});

describe("queue ordering", () => {
  it("places priority users before normal users", async () => {
    await joinQueue(queueId, firstUserId, {
      priority: "normal",
    });

    await joinQueue(queueId, secondUserId, {
      priority: "priority",
    });

    const queue = await listQueue(queueId);

    expect(queue).toHaveLength(2);

    expect(queue[0]).toMatchObject({
      userId: secondUserId,
      priority: QueueEntryPriority.PRIORITY,
      position: 1,
    });

    expect(queue[1]).toMatchObject({
      userId: firstUserId,
      priority: QueueEntryPriority.NORMAL,
      position: 2,
    });
  });

  it("orders users with the same priority by join time", async () => {
    await joinQueue(queueId, firstUserId);
    await joinQueue(queueId, secondUserId);

    const queue = await listQueue(queueId);

    expect(queue).toHaveLength(2);
    expect(queue[0]?.userId).toBe(firstUserId);
    expect(queue[1]?.userId).toBe(secondUserId);
  });
});

describe("leaveQueue", () => {
  it("changes the entry status to canceled", async () => {
    const joinedEntry = await joinQueue(queueId, firstUserId);

    const canceledEntry = await leaveQueue(queueId, firstUserId);

    expect(canceledEntry.status).toBe(QueueEntryStatus.CANCELED);

    const savedEntry = await prisma.queueEntry.findUnique({
      where: {
        id: joinedEntry.id,
      },
    });

    expect(savedEntry?.status).toBe(QueueEntryStatus.CANCELED);
  });

  it("recalculates remaining positions", async () => {
    await joinQueue(queueId, firstUserId);
    await joinQueue(queueId, secondUserId);

    await leaveQueue(queueId, firstUserId);

    const queue = await listQueue(queueId);

    expect(queue).toHaveLength(1);

    expect(queue[0]).toMatchObject({
      userId: secondUserId,
      position: 1,
      estimatedWaitMinutes: 0,
    });
  });

  it("rejects leaving when the user is not waiting", async () => {
    await expect(leaveQueue(queueId, firstUserId)).rejects.toThrow(
      "You are not currently waiting in this queue.",
    );
  });
});

describe("getUserQueueStatus", () => {
  it("returns the user's position and estimated wait time", async () => {
    await joinQueue(queueId, firstUserId);
    await joinQueue(queueId, secondUserId);

    const status = await getUserQueueStatus(queueId, secondUserId);

    expect(status).toMatchObject({
      userId: secondUserId,
      position: 2,
      estimatedWaitMinutes: 20,
      status: QueueEntryStatus.WAITING,
    });
  });

  it("rejects a user who is not waiting", async () => {
    await expect(getUserQueueStatus(queueId, firstUserId)).rejects.toThrow(
      "You are not currently waiting in this queue.",
    );
  });
});

describe("serveNext", () => {
  it("serves the first waiting user", async () => {
    const joinedEntry = await joinQueue(queueId, firstUserId);

    const servedEntry = await serveNext(queueId);

    expect(servedEntry).toMatchObject({
      userId: firstUserId,
      status: QueueEntryStatus.SERVED,
    });

    const savedEntry = await prisma.queueEntry.findUnique({
      where: {
        id: joinedEntry.id,
      },
    });

    expect(savedEntry?.status).toBe(QueueEntryStatus.SERVED);
  });

  it("serves a priority user before a normal user", async () => {
    await joinQueue(queueId, firstUserId, {
      priority: "normal",
    });

    await joinQueue(queueId, secondUserId, {
      priority: "priority",
    });

    const servedEntry = await serveNext(queueId);

    expect(servedEntry.userId).toBe(secondUserId);
    expect(servedEntry.priority).toBe(QueueEntryPriority.PRIORITY);
  });

  it("recalculates positions after serving a user", async () => {
    await joinQueue(queueId, firstUserId);
    await joinQueue(queueId, secondUserId);

    await serveNext(queueId);

    const queue = await listQueue(queueId);

    expect(queue).toHaveLength(1);

    expect(queue[0]).toMatchObject({
      userId: secondUserId,
      position: 1,
      estimatedWaitMinutes: 0,
    });
  });

  it("throws when the queue is empty", async () => {
    await expect(serveNext(queueId)).rejects.toThrow(
      "There is nobody waiting in this queue.",
    );
  });
});
