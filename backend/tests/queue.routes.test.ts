import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { resetStore } from "../src/store/memoryStore";
import { adminToken, bearer, userToken } from "./helpers";

const app = createApp();

beforeEach(() => {
  resetStore();
});

describe("POST /api/queues/:serviceId/join", () => {
  it("allows an authenticated user to join", async () => {
    const response = await request(app)
      .post("/api/queues/1/join")
      .set("Authorization", bearer(userToken()))
      .send({ priority: "normal" });

    expect(response.status).toBe(201);
    expect(response.body.entry).toMatchObject({
      userId: 1,
      serviceId: 1,
      position: 1,
      estimatedWaitMinutes: 0,
    });
  });

  it("returns 401 without authentication", async () => {
    const response = await request(app)
      .post("/api/queues/1/join")
      .send({});

    expect(response.status).toBe(401);
  });

  it("returns 409 when joining twice", async () => {
    await request(app)
      .post("/api/queues/1/join")
      .set("Authorization", bearer(userToken()))
      .send({});

    const response = await request(app)
      .post("/api/queues/1/join")
      .set("Authorization", bearer(userToken()))
      .send({});

    expect(response.status).toBe(409);
  });

  it("returns 404 for an unknown service", async () => {
    const response = await request(app)
      .post("/api/queues/999/join")
      .set("Authorization", bearer(userToken()));

    expect(response.status).toBe(404);
  });
});

describe("GET /api/queues/:serviceId/status", () => {
  it("returns the user's queue status", async () => {
    await request(app)
      .post("/api/queues/1/join")
      .set("Authorization", bearer(userToken()));

    const response = await request(app)
      .get("/api/queues/1/status")
      .set("Authorization", bearer(userToken()));

    expect(response.status).toBe(200);
    expect(response.body.entry.position).toBe(1);
  });
});

describe("DELETE /api/queues/:serviceId/leave", () => {
  it("allows a user to leave", async () => {
    await request(app)
      .post("/api/queues/1/join")
      .set("Authorization", bearer(userToken()));

    const response = await request(app)
      .delete("/api/queues/1/leave")
      .set("Authorization", bearer(userToken()));

    expect(response.status).toBe(200);
    expect(response.body.entry.userId).toBe(1);
  });
});

describe("GET /api/queues/:serviceId", () => {
  it("allows an admin to view the queue", async () => {
    await request(app)
      .post("/api/queues/1/join")
      .set("Authorization", bearer(userToken()));

    const response = await request(app)
      .get("/api/queues/1")
      .set("Authorization", bearer(adminToken()));

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
  });

  it("returns 403 for a normal user", async () => {
    const response = await request(app)
      .get("/api/queues/1")
      .set("Authorization", bearer(userToken()));

    expect(response.status).toBe(403);
  });
});

describe("POST /api/queues/:serviceId/serve", () => {
  it("allows an admin to serve the next user", async () => {
    await request(app)
      .post("/api/queues/1/join")
      .set("Authorization", bearer(userToken()));

    const response = await request(app)
      .post("/api/queues/1/serve")
      .set("Authorization", bearer(adminToken()));

    expect(response.status).toBe(200);
    expect(response.body.servedEntry.userId).toBe(1);
  });

  it("returns 404 when the queue is empty", async () => {
    const response = await request(app)
      .post("/api/queues/1/serve")
      .set("Authorization", bearer(adminToken()));

    expect(response.status).toBe(404);
  });
});
