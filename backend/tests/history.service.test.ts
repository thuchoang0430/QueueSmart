import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  getUserHistory,
  recordHistory,
} from "../src/modules/history/history.service";
import {
  disconnectDb,
  resetUsers,
} from "./db";

beforeEach(async () => {
  await resetUsers();
});

afterAll(async () => {
  await disconnectDb();
});

describe("getUserHistory", () => {
  it("returns an empty array when the user has no history", async () => {
    expect(await getUserHistory(1)).toEqual([]);
  });

  it("returns only records belonging to the requested user", async () => {
    const now = Date.now();

    await recordHistory({
      userId: 1,
      serviceId: 1,
      serviceName: "Academic Advising",
      joinedAt: now - 10 * 60000,
      endedAt: now,
      outcome: "served",
    });

    await recordHistory({
      userId: 2,
      serviceId: 2,
      serviceName: "Financial Aid",
      joinedAt: now - 5 * 60000,
      endedAt: now,
      outcome: "left",
    });

    const userHistory = await getUserHistory(1);

    expect(userHistory).toHaveLength(1);
    expect(userHistory[0].userId).toBe(1);
    expect(userHistory[0].serviceName).toBe("Academic Advising");
  });

  it("orders records most recent first", async () => {
    const now = Date.now();

    await recordHistory({
      userId: 1,
      serviceId: 1,
      serviceName: "Older Service",
      joinedAt: now - 30 * 60000,
      endedAt: now - 20 * 60000,
      outcome: "served",
    });

    await recordHistory({
      userId: 1,
      serviceId: 2,
      serviceName: "Newer Service",
      joinedAt: now - 10 * 60000,
      endedAt: now - 5 * 60000,
      outcome: "left",
    });

    const history = await getUserHistory(1);

    expect(history).toHaveLength(2);
    expect(history[0].serviceName).toBe("Newer Service");
    expect(history[1].serviceName).toBe("Older Service");
  });

  it("returns an empty array for an unknown user", async () => {
    expect(await getUserHistory(999)).toEqual([]);
  });
});

describe("recordHistory", () => {
  it("persists a record and assigns an id", async () => {
    const record = await recordHistory({
      userId: 1,
      serviceId: 1,
      serviceName: "Academic Advising",
      joinedAt: Date.now() - 15 * 60000,
      outcome: "served",
    });

    expect(record.id).toBeGreaterThan(0);

    const history = await getUserHistory(1);

    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(record.id);
  });

  it("derives wait minutes from joinedAt and endedAt", async () => {
    const joinedAt = Date.now() - 20 * 60000;
    const endedAt = joinedAt + 20 * 60000;

    const record = await recordHistory({
      userId: 1,
      serviceId: 1,
      serviceName: "Academic Advising",
      joinedAt,
      endedAt,
      outcome: "served",
    });

    expect(record.waitMinutes).toBe(20);
  });

  it("rounds wait minutes to the nearest minute", async () => {
    const joinedAt = Date.now();
    const endedAt = joinedAt + 90 * 1000;

    const record = await recordHistory({
      userId: 1,
      serviceId: 1,
      serviceName: "Academic Advising",
      joinedAt,
      endedAt,
      outcome: "left",
    });

    expect(record.waitMinutes).toBe(2);
  });

  it("never produces a negative wait time", async () => {
    const joinedAt = Date.now();
    const endedAt = joinedAt - 5 * 60000;

    const record = await recordHistory({
      userId: 1,
      serviceId: 1,
      serviceName: "Academic Advising",
      joinedAt,
      endedAt,
      outcome: "served",
    });

    expect(record.waitMinutes).toBe(0);
  });

  it("defaults endedAt to the current time", async () => {
    const before = Date.now();

    const record = await recordHistory({
      userId: 1,
      serviceId: 1,
      serviceName: "Academic Advising",
      joinedAt: before - 60000,
      outcome: "served",
    });

    expect(record.endedAt).toBeGreaterThanOrEqual(before);
  });

  it("preserves served and left outcomes", async () => {
    const now = Date.now();

    const leftRecord = await recordHistory({
      userId: 1,
      serviceId: 1,
      serviceName: "Academic Advising",
      joinedAt: now - 60000,
      outcome: "left",
    });

    const servedRecord = await recordHistory({
      userId: 1,
      serviceId: 2,
      serviceName: "Financial Aid",
      joinedAt: now - 60000,
      outcome: "served",
    });

    expect(leftRecord.outcome).toBe("left");
    expect(servedRecord.outcome).toBe("served");
  });

  it("keeps the service name without requiring a Service record", async () => {
    const record = await recordHistory({
      userId: 1,
      serviceId: 999,
      serviceName: "Deleted Service",
      joinedAt: Date.now() - 60000,
      outcome: "served",
    });

    expect(record.serviceName).toBe("Deleted Service");
  });
});
