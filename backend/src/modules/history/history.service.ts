import {
  HistoryOutcome as DatabaseHistoryOutcome,
  type History as DatabaseHistory,
} from "../../generated/prisma/client";
import { prisma } from "../../database/prisma";

export type HistoryOutcome = "served" | "left";

export interface HistoryRecord {
  id: number;
  userId: number;
  serviceId: number;
  serviceName: string;
  joinedAt: number;
  endedAt: number;
  waitMinutes: number;
  outcome: HistoryOutcome;
}

export interface RecordHistoryInput {
  userId: number;
  serviceId: number;
  serviceName: string;
  /** Epoch milliseconds when the user joined the queue. */
  joinedAt: number;
  outcome: HistoryOutcome;
  /** Epoch milliseconds when the visit ended. Defaults to now. */
  endedAt?: number;
}

function toDatabaseOutcome(
  outcome: HistoryOutcome,
): DatabaseHistoryOutcome {
  return outcome === "served"
    ? DatabaseHistoryOutcome.SERVED
    : DatabaseHistoryOutcome.LEFT;
}

function fromDatabaseOutcome(
  outcome: DatabaseHistoryOutcome,
): HistoryOutcome {
  return outcome === DatabaseHistoryOutcome.SERVED
    ? "served"
    : "left";
}

function toHistoryRecord(record: DatabaseHistory): HistoryRecord {
  return {
    id: record.id,
    userId: record.userId,
    serviceId: record.serviceId,
    serviceName: record.serviceName,
    joinedAt: record.joinedAt.getTime(),
    endedAt: record.endedAt.getTime(),
    waitMinutes: record.waitMinutes,
    outcome: fromDatabaseOutcome(record.outcome),
  };
}

/** Returns one user's history, most recent first. */
export async function getUserHistory(
  userId: number,
): Promise<HistoryRecord[]> {
  const records = await prisma.history.findMany({
    where: {
      userId,
    },
    orderBy: {
      endedAt: "desc",
    },
  });

  return records.map(toHistoryRecord);
}

/** Creates and persists a completed queue visit. */
export async function recordHistory(
  input: RecordHistoryInput,
): Promise<HistoryRecord> {
  const endedAt = input.endedAt ?? Date.now();

  const waitMinutes = Math.max(
    0,
    Math.round((endedAt - input.joinedAt) / 60000),
  );

  const record = await prisma.history.create({
    data: {
      userId: input.userId,
      serviceId: input.serviceId,
      serviceName: input.serviceName,
      joinedAt: new Date(input.joinedAt),
      endedAt: new Date(endedAt),
      waitMinutes,
      outcome: toDatabaseOutcome(input.outcome),
    },
  });

  return toHistoryRecord(record);
}
