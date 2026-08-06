import request from "supertest";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { createApp } from "../src/app";
import { recordHistory } from "../src/modules/history/history.service";
import {
  adminToken,
  bearer,
  userToken,
} from "./helpers";
import {
  disconnectDb,
  resetUsers,
} from "./db";

const app = createApp();

beforeEach(async () => {
  await resetUsers();
});

afterAll(async () => {
  await disconnectDb();
});

describe("GET /api/history", () => {
  it("returns the signed-in user's history", async () => {
    await recordHistory({
      userId: 1,
      serviceId: 1,
      serviceName: "Academic Advising",
      joinedAt: Date.now() - 10 * 60000,
      outcome: "served",
    });

    const response = await request(app)
      .get("/api/history")
      .set("Authorization", bearer(userToken()));

    expect(response.status).toBe(200);
    expect(response.body.history).toHaveLength(1);
    expect(response.body.history[0]).toMatchObject({
      userId: 1,
      serviceId: 1,
      serviceName: "Academic Advising",
      outcome: "served",
    });
  });

  it("returns an empty list for a user with no history", async () => {
    const response = await request(app)
      .get("/api/history")
      .set("Authorization", bearer(adminToken()));

    expect(response.status).toBe(200);
    expect(response.body.history).toEqual([]);
  });

  it("returns 401 without a token", async () => {
    const response = await request(app).get("/api/history");

    expect(response.status).toBe(401);
  });

  it("returns 401 for an unknown token", async () => {
    const response = await request(app)
      .get("/api/history")
      .set("Authorization", bearer("session-fake"));

    expect(response.status).toBe(401);
  });

  it("returns records most recent first", async () => {
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

    const response = await request(app)
      .get("/api/history")
      .set("Authorization", bearer(userToken()));

    expect(response.status).toBe(200);
    expect(response.body.history).toHaveLength(2);
    expect(response.body.history[0].serviceName).toBe(
      "Newer Service",
    );
    expect(response.body.history[1].serviceName).toBe(
      "Older Service",
    );
  });
});
