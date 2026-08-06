import request from "supertest";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { createApp } from "../src/app";
import { prisma } from "../src/database/prisma";
import {
  notifyAlmostServed,
  notifyQueueJoined,
} from "../src/modules/notifications/notifications.service";
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

describe("GET /api/notifications", () => {
  it("returns the signed-in user's notifications and unread count", async () => {
    const first = await notifyQueueJoined(
      1,
      "Academic Advising",
    );

    await notifyAlmostServed(
      1,
      "Academic Advising",
    );

    await prisma.notification.update({
      where: {
        id: first.id,
      },
      data: {
        read: true,
      },
    });

    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", bearer(userToken()));

    expect(response.status).toBe(200);
    expect(response.body.notifications).toHaveLength(2);
    expect(response.body.unreadCount).toBe(1);
  });

  it("returns an empty list for a user with no notifications", async () => {
    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", bearer(adminToken()));

    expect(response.status).toBe(200);
    expect(response.body.notifications).toEqual([]);
    expect(response.body.unreadCount).toBe(0);
  });

  it("returns 401 without a token", async () => {
    const response = await request(app).get(
      "/api/notifications",
    );

    expect(response.status).toBe(401);
  });
});

describe("POST /api/notifications/read", () => {
  it("marks all of the user's notifications as read", async () => {
    await notifyQueueJoined(
      1,
      "Academic Advising",
    );

    await notifyAlmostServed(
      1,
      "Academic Advising",
    );

    const token = userToken();

    const markResponse = await request(app)
      .post("/api/notifications/read")
      .set("Authorization", bearer(token));

    expect(markResponse.status).toBe(200);
    expect(markResponse.body.updated).toBe(2);

    const afterResponse = await request(app)
      .get("/api/notifications")
      .set("Authorization", bearer(token));

    expect(afterResponse.status).toBe(200);
    expect(afterResponse.body.unreadCount).toBe(0);

    expect(
      afterResponse.body.notifications.every(
        (notification: { read: boolean }) =>
          notification.read,
      ),
    ).toBe(true);
  });

  it("returns 401 without a token", async () => {
    const response = await request(app).post(
      "/api/notifications/read",
    );

    expect(response.status).toBe(401);
  });
});
