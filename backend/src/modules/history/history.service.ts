import {
  nextId,
  store,
  type HistoryOutcome,
  type HistoryRecord,
} from '../../store/memoryStore'

// History module for A3. Tracks each user's past queue participation.
//
// Read side: getUserHistory powers the History page.
// Write side: recordHistory is called by the queue module when a user leaves
// a queue or is served, so a record is created the moment a visit ends.
//
// As with every module, this is plain logic over the store - no Express here.

export interface RecordHistoryInput {
  userId: number
  serviceId: number
  serviceName: string
  /** Epoch ms the user joined the queue. */
  joinedAt: number
  /** How the visit ended. */
  outcome: HistoryOutcome
  /** Epoch ms the visit ended. Defaults to now. */
  endedAt?: number
}

/** Returns one user's history, most recent first. */
export function getUserHistory(userId: number): HistoryRecord[] {
  return store.history
    .filter((record) => record.userId === userId)
    .sort((a, b) => b.endedAt - a.endedAt)
}

/**
 * Appends a completed visit to the history log and returns the new record.
 * Wait time is derived from how long the user actually waited, floored at 0 so
 * clock skew can never produce a negative number.
 */
export function recordHistory(input: RecordHistoryInput): HistoryRecord {
  const endedAt = input.endedAt ?? Date.now()
  const waitMinutes = Math.max(0, Math.round((endedAt - input.joinedAt) / 60000))

  const record: HistoryRecord = {
    id: nextId('history'),
    userId: input.userId,
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    joinedAt: input.joinedAt,
    endedAt,
    waitMinutes,
    outcome: input.outcome,
  }

  store.history.push(record)
  return record
}
