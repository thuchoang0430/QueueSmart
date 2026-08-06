import request from "supertest";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  QueueEntryStatus,
  QueueStatus,
  UserRole,
} from "../src/generated/prisma/client";
import { createApp } from "../src/app";
import { prisma } from "../src/database/prisma";
import { resetStore } from "../src/store/memoryStore";
import {
  adminToken,
  bearer,
  userToken,
} from "./helpers";

const app = createApp();

let serviceId: number;

async function clearTestData(): Promise<void> {
  await prisma.history.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.service.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.userCredential.deleteMany();
}

beforeEach(async () => {
  resetStore();

  await clearTestData();

  await prisma.userCredential.create({
    data: {
      id: 1,
      email: "user@test.com",
      passwordHash: "hashed-password",
      role: UserRole.USER,
      profile: {
        create: {
          fullName: "Student User",
          email: "user@test.com",
        },
      },
    },
  });

  await prisma.userCredential.create({
    data: {
      id: 2,
      email: "admin@test.com",
      passwordHash: "hashed-password",
      role: UserRole.ADMIN,
      profile: {
        create: {
          fullName: "Admin User",
          email: "admin@test.com",
        },
      },
    },
  });

  const service = await prisma.service.create({
    data: {
      name: "Academic Advising",
      description:
        "Academic advising and course planning.",
      expectedDuration: 20,
      priorityLevel: 2,
    },
  });

  await prisma.queue.create({
    data: {
      serviceId: service.id,
      status: QueueStatus.OPEN,
    },
  });

  serviceId = service.id;
});

afterAll(async () => {
  await clearTestData();
  await prisma.$disconnect();
});

describe("POST /api/queues/:serviceId/join", () => {
  it("returns the frontend QueueEntry format", async () => {
    const response = await request(app)
      .post(`/api/queues/${serviceId}/join`)
      .set(
        "Authorization",
        bearer(userToken()),
      )
      .send({
        priority: "normal",
      });

    expect(response.status).toBe(201);

    expect(response.body.entry).toMatchObject({
      userId: 1,
      serviceId,
      name: "Student User",
      email: "user@test.com",
      priority: "normal",
      position: 1,
      status: QueueEntryStatus.WAITING,
      estimatedWaitMinutes: 0,
      joinedAt: expect.any(Number),
    });

    expect(
      response.body.entry,
    ).not.toHaveProperty("user");

    expect(
      response.body.entry,
    ).not.toHaveProperty("joinTime");

    expect(
      response.body.entry,
    ).not.toHaveProperty("queueId");
  });

  it("returns 401 without authentication", async () => {
    const response = await request(app)
      .post(`/api/queues/${serviceId}/join`)
      .send({});

    expect(response.status).toBe(401);
  });

  it("returns 409 when joining twice", async () => {
    await request(app)
      .post(`/api/queues/${serviceId}/join`)
      .set(
        "Authorization",
        bearer(userToken()),
      )
      .send({});

    const response = await request(app)
      .post(`/api/queues/${serviceId}/join`)
      .set(
        "Authorization",
        bearer(userToken()),
      )
      .send({});

    expect(response.status).toBe(409);
  });

  it("returns 404 for an unknown service", async () => {
    const response = await request(app)
      .post("/api/queues/999999/join")
      .set(
        "Authorization",
        bearer(userToken()),
      )
      .send({});

    expect(response.status).toBe(404);
  });
});

describe("GET /api/queues/:serviceId/status", () => {
  it("returns the user's queue status", async () => {
    await request(app)
      .post(`/api/queues/${serviceId}/join`)
      .set(
        "Authorization",
        bearer(userToken()),
      )
      .send({});

    const response = await request(app)
      .get(`/api/queues/${serviceId}/status`)
      .set(
        "Authorization",
        bearer(userToken()),
      );

    expect(response.status).toBe(200);

    expect(response.body.entry).toMatchObject({
      userId: 1,
      serviceId,
      name: "Student User",
      email: "user@test.com",
      priority: "normal",
      position: 1,
      joinedAt: expect.any(Number),
    });
  });
});

describe("DELETE /api/queues/:serviceId/leave", () => {
  it("returns the canceled entry in the API format", async () => {
    await request(app)
      .post(`/api/queues/${serviceId}/join`)
      .set(
        "Authorization",
        bearer(userToken()),
      )
      .send({});

    const response = await request(app)
      .delete(`/api/queues/${serviceId}/leave`)
      .set(
        "Authorization",
        bearer(userToken()),
      );

    expect(response.status).toBe(200);

    expect(response.body.entry).toMatchObject({
      userId: 1,
      serviceId,
      name: "Student User",
      email: "user@test.com",
      priority: "normal",
      status: QueueEntryStatus.CANCELED,
      position: 0,
      estimatedWaitMinutes: 0,
    });
  });
});

describe("GET /api/queues/:serviceId", () => {
  it("allows an admin to view the formatted queue", async () => {
    await request(app)
      .post(`/api/queues/${serviceId}/join`)
      .set(
        "Authorization",
        bearer(userToken()),
      )
      .send({});

    const response = await request(app)
      .get(`/api/queues/${serviceId}`)
      .set(
        "Authorization",
        bearer(adminToken()),
      );

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);

    expect(response.body.queue[0]).toMatchObject({
      userId: 1,
      serviceId,
      name: "Student User",
      email: "user@test.com",
      priority: "normal",
      joinedAt: expect.any(Number),
    });
  });

  it("returns 403 for a normal user", async () => {
    const response = await request(app)
      .get(`/api/queues/${serviceId}`)
      .set(
        "Authorization",
        bearer(userToken()),
      );

    expect(response.status).toBe(403);
  });
});

describe("POST /api/queues/:serviceId/serve", () => {
  it("returns the served user in the API format", async () => {
    await request(app)
      .post(`/api/queues/${serviceId}/join`)
      .set(
        "Authorization",
        bearer(userToken()),
      )
      .send({});

    const response = await request(app)
      .post(`/api/queues/${serviceId}/serve`)
      .set(
        "Authorization",
        bearer(adminToken()),
      );

    expect(response.status).toBe(200);

    expect(response.body.servedEntry).toMatchObject({
      userId: 1,
      serviceId,
      name: "Student User",
      email: "user@test.com",
      priority: "normal",
      status: QueueEntryStatus.SERVED,
      position: 0,
      estimatedWaitMinutes: 0,
    });
  });

  it("returns 404 when the queue is empty", async () => {
    const response = await request(app)
      .post(`/api/queues/${serviceId}/serve`)
      .set(
        "Authorization",
        bearer(adminToken()),
      );

    expect(response.status).toBe(404);
  });
});
