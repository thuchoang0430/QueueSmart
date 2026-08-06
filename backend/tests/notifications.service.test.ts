import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  createNotification,
  getUserNotifications,
  markAllRead,
  notifyAlmostServed,
  notifyQueueJoined,
  notifyServed,
  unreadCount,
} from "../src/modules/notifications/notifications.service";
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

describe("getUserNotifications", () => {
  it("returns an empty array for a user with no notifications", async () => {
    expect(await getUserNotifications(1)).toEqual([]);
  });

  it("only returns notifications belonging to the requested user", async () => {
    await notifyQueueJoined(1, "Academic Advising");
    await notifyQueueJoined(2, "Financial Aid");

    const notifications = await getUserNotifications(1);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].userId).toBe(1);
    expect(notifications[0].message).toContain(
      "Academic Advising",
    );
  });

  it("orders notifications most recent first", async () => {
    await createNotification({
      userId: 1,
      type: "joined",
      message: "First",
    });

    await new Promise((resolve) => setTimeout(resolve, 5));

    await createNotification({
      userId: 1,
      type: "served",
      message: "Second",
    });

    const notifications = await getUserNotifications(1);

    expect(notifications).toHaveLength(2);
    expect(notifications[0].message).toBe("Second");
    expect(notifications[1].message).toBe("First");
  });
});

describe("createNotification", () => {
  it("persists an unread notification with an id", async () => {
    const notification = await createNotification({
      userId: 1,
      type: "joined",
      message: "Hello",
    });

    expect(notification.id).toBeGreaterThan(0);
    expect(notification.read).toBe(false);
    expect(notification.createdAt).toBeGreaterThan(0);

    const stored = await getUserNotifications(1);

    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(notification.id);
  });
});

describe("notification helpers", () => {
  it("creates a joined notification", async () => {
    const notification = await notifyQueueJoined(
      1,
      "IT Help Desk",
    );

    expect(notification.type).toBe("joined");
    expect(notification.message).toContain("IT Help Desk");
  });

  it("creates an almost-up notification", async () => {
    const notification = await notifyAlmostServed(
      1,
      "IT Help Desk",
    );

    expect(notification.type).toBe("almost-up");
    expect(notification.message).toContain("almost up");
  });

  it("creates a served notification", async () => {
    const notification = await notifyServed(
      1,
      "IT Help Desk",
    );

    expect(notification.type).toBe("served");
    expect(notification.message).toContain("served");
  });
});

describe("unreadCount", () => {
  it("counts unread notifications for one user", async () => {
    await notifyQueueJoined(1, "Academic Advising");
    await notifyQueueJoined(1, "Financial Aid");
    await notifyQueueJoined(2, "IT Help Desk");

    expect(await unreadCount(1)).toBe(2);
    expect(await unreadCount(2)).toBe(1);
  });

  it("returns zero when the user has no notifications", async () => {
    expect(await unreadCount(1)).toBe(0);
  });
});

describe("markAllRead", () => {
  it("marks all unread notifications as read", async () => {
    await notifyQueueJoined(1, "Academic Advising");
    await notifyAlmostServed(1, "Academic Advising");

    const updated = await markAllRead(1);

    expect(updated).toBe(2);
    expect(await unreadCount(1)).toBe(0);

    const notifications = await getUserNotifications(1);

    expect(
      notifications.every((notification) => notification.read),
    ).toBe(true);
  });

  it("returns zero when nothing is unread", async () => {
    expect(await markAllRead(1)).toBe(0);
  });

  it("does not update another user's notifications", async () => {
    await notifyQueueJoined(1, "Academic Advising");
    await notifyQueueJoined(2, "Financial Aid");

    await markAllRead(1);

    expect(await unreadCount(1)).toBe(0);
    expect(await unreadCount(2)).toBe(1);
  });
});
