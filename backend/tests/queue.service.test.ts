import { beforeEach, describe, expect, it } from "vitest";

import {
  estimateWaitTime,
  getUserQueueStatus,
  joinQueue,
  leaveQueue,
  listQueue,
  serveNext,
} from "../src/modules/queues/queue.service";
import { resetStore, store } from "../src/store/memoryStore";

beforeEach(() => {
  resetStore();
});

describe("estimateWaitTime", () => {
  it("returns zero for the first person", () => {
    expect(estimateWaitTime(1, 20)).toBe(0);
  });

  it("returns one service duration for the second person", () => {
    expect(estimateWaitTime(2, 20)).toBe(20);
  });

  it("never returns a negative value", () => {
    expect(estimateWaitTime(0, 20)).toBe(0);
  });
});

describe("joinQueue", () => {
  it("adds a user to an open service queue", () => {
    const entry = joinQueue(1, 1);

    expect(entry.userId).toBe(1);
    expect(entry.serviceId).toBe(1);
    expect(entry.position).toBe(1);
    expect(entry.estimatedWaitMinutes).toBe(0);
    expect(store.queueEntries).toHaveLength(1);
  });

  it("creates a joined notification", () => {
    const initialCount = store.notifications.length;

    joinQueue(1, 1);

    expect(store.notifications).toHaveLength(initialCount + 1);
    expect(store.notifications.at(-1)).toMatchObject({
      userId: 1,
      type: "joined",
    });
  });

  it("prevents joining the same queue twice", () => {
    joinQueue(1, 1);

    expect(() => joinQueue(1, 1)).toThrow(
      "You are already waiting in this queue.",
    );
  });

  it("rejects joining a closed service", () => {
    const service = store.services.find((item) => item.id === 1);

    if (!service) {
      throw new Error("Seeded service was not found.");
    }

    service.status = "closed";

    expect(() => joinQueue(1, 1)).toThrow(
      "Academic Advising is currently closed.",
    );
  });
});

describe("queue ordering", () => {
  it("puts priority entries before normal entries", () => {
    joinQueue(1, 1, { priority: "normal" });
    joinQueue(1, 2, { priority: "priority" });

    const queue = listQueue(1);

    expect(queue[0]?.userId).toBe(2);
    expect(queue[1]?.userId).toBe(1);
  });
});

describe("leaveQueue", () => {
  it("removes the user and records left history", () => {
    joinQueue(1, 1);

    const initialHistoryCount = store.history.length;

    leaveQueue(1, 1);

    expect(store.queueEntries).toHaveLength(0);
    expect(store.history).toHaveLength(initialHistoryCount + 1);
    expect(store.history.at(-1)).toMatchObject({
      userId: 1,
      serviceId: 1,
      outcome: "left",
    });
  });
});

describe("getUserQueueStatus", () => {
  it("returns the user's queue position", () => {
    joinQueue(1, 1);

    const status = getUserQueueStatus(1, 1);

    expect(status.position).toBe(1);
    expect(status.estimatedWaitMinutes).toBe(0);
  });
});

describe("serveNext", () => {
  it("serves and removes the first user", () => {
    joinQueue(1, 1);

    const served = serveNext(1);

    expect(served.userId).toBe(1);
    expect(store.queueEntries).toHaveLength(0);
  });

  it("records served history", () => {
    joinQueue(1, 1);

    const initialHistoryCount = store.history.length;

    serveNext(1);

    expect(store.history).toHaveLength(initialHistoryCount + 1);
    expect(store.history.at(-1)).toMatchObject({
      userId: 1,
      serviceId: 1,
      outcome: "served",
    });
  });

  it("creates a served notification", () => {
    joinQueue(1, 1);

    const initialNotificationCount = store.notifications.length;

    serveNext(1);

    expect(store.notifications).toHaveLength(
      initialNotificationCount + 1,
    );
    expect(store.notifications.at(-1)).toMatchObject({
      userId: 1,
      type: "served",
    });
  });

  it("throws when the queue is empty", () => {
    expect(() => serveNext(1)).toThrow(
      "There is nobody waiting in this queue.",
    );
  });
});
