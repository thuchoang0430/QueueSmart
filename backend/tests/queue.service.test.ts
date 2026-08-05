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

let serviceId: number;
let queueId: number;
let firstUserId: number;
let secondUserId: number;

async function clearTestData(): Promise<void> {
  await prisma.queueEntry.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.service.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.userCredential.deleteMany();
}

beforeEach(async () => {
  await clearTestData();

  const firstUser = await prisma.userCredential.create({
    data: {
      email: "queue-user-one@test.com",
      passwordHash: "hashed-password",
      role: UserRole.USER,
      profile: {
        create: {
          fullName: "Queue User One",
          email: "queue-user-one@test.com",
        },
      },
    },
  });

  const secondUser = await prisma.userCredential.create({
    data: {
      email: "queue-user-two@test.com",
      passwordHash: "hashed-password",
      role: UserRole.USER,
      profile: {
        create: {
          fullName: "Queue User Two",
          email: "queue-user-two@test.com",
        },
      },
    },
  });

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

  firstUserId = firstUser.id;
  secondUserId = secondUser.id;
  serviceId = service.id;
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

    expect(result.userId).toBe(firstUserId);
    expect(result.queueId).toBe(queueId);
    expect(result.position).toBe(1);
    expect(result.status).toBe(QueueEntryStatus.WAITING);
    expect(result.estimatedWaitMinutes).toBe(0);

    const savedEntry = await prisma.queueEntry.findFirst({
      where: {
        queueId,
        userId: firstUserId,
      },
    });

    expect(savedEntry).not.toBeNull();
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
    await expect(joinQueue(queueId, 999999)).rejects.toThrow("No user found");
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
    expect(queue[0]?.userId).toBe(secondUserId);
    expect(queue[0]?.priority).toBe(QueueEntryPriority.PRIORITY);
    expect(queue[0]?.position).toBe(1);
    expect(queue[1]?.userId).toBe(firstUserId);
    expect(queue[1]?.position).toBe(2);
  });

  it("orders users with the same priority by join time", async () => {
    await joinQueue(queueId, firstUserId);
    await joinQueue(queueId, secondUserId);

    const queue = await listQueue(queueId);

    expect(queue[0]?.userId).toBe(firstUserId);
    expect(queue[1]?.userId).toBe(secondUserId);
  });
});

describe("leaveQueue", () => {
  it("changes the entry status to canceled", async () => {
    const joined = await joinQueue(queueId, firstUserId);

    const result = await leaveQueue(queueId, firstUserId);

    expect(result.status).toBe(QueueEntryStatus.CANCELED);

    const savedEntry = await prisma.queueEntry.findUnique({
      where: {
        id: joined.id,
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
    expect(queue[0]?.userId).toBe(secondUserId);
    expect(queue[0]?.position).toBe(1);
  });

  it("rejects leaving when user is not waiting", async () => {
    await expect(leaveQueue(queueId, firstUserId)).rejects.toThrow(
      "You are not currently waiting in this queue.",
    );
  });
});

describe("getUserQueueStatus", () => {
  it("returns position and estimated wait time", async () => {
    await joinQueue(queueId, firstUserId);
    await joinQueue(queueId, secondUserId);

    const status = await getUserQueueStatus(queueId, secondUserId);

    expect(status.position).toBe(2);
    expect(status.estimatedWaitMinutes).toBe(20);
  });
});

describe("serveNext", () => {
  it("serves the first waiting user", async () => {
    const joined = await joinQueue(queueId, firstUserId);

    const served = await serveNext(queueId);

    expect(served.userId).toBe(firstUserId);
    expect(served.status).toBe(QueueEntryStatus.SERVED);

    const savedEntry = await prisma.queueEntry.findUnique({
      where: {
        id: joined.id,
      },
    });

    expect(savedEntry?.status).toBe(QueueEntryStatus.SERVED);
  });

  it("serves a priority user first", async () => {
    await joinQueue(queueId, firstUserId, {
      priority: "normal",
    });

    await joinQueue(queueId, secondUserId, {
      priority: "priority",
    });

    const served = await serveNext(queueId);

    expect(served.userId).toBe(secondUserId);
  });

  it("recalculates queue positions after serving", async () => {
    await joinQueue(queueId, firstUserId);
    await joinQueue(queueId, secondUserId);

    await serveNext(queueId);

    const queue = await listQueue(queueId);

    expect(queue).toHaveLength(1);
    expect(queue[0]?.userId).toBe(secondUserId);
    expect(queue[0]?.position).toBe(1);
    expect(queue[0]?.estimatedWaitMinutes).toBe(0);
  });

  it("throws when the queue is empty", async () => {
    await expect(serveNext(queueId)).rejects.toThrow(
      "There is nobody waiting in this queue.",
    );
  });
});
