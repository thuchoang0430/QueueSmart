import bcrypt from 'bcryptjs'
import { prisma } from '../src/database/prisma'

// DB reset for the tests that actually hit PostgreSQL (the auth suites). Other
// suites use the in-memory store and never call this.

interface DemoUser {
  email: string
  password: string
  fullName: string
  role: 'USER' | 'ADMIN'
}

const demoUsers: DemoUser[] = [
  { email: 'user@test.com', password: 'password', fullName: 'Student User', role: 'USER' },
  { email: 'admin@test.com', password: 'password', fullName: 'Admin User', role: 'ADMIN' },
]

// bcrypt hashing is deliberately slow, so hash the two demo passwords once and
// reuse them across every reset rather than re-hashing in each beforeEach.
let cachedHashes: Map<string, string> | null = null
async function demoHashes(): Promise<Map<string, string>> {
  if (!cachedHashes) {
    cachedHashes = new Map()
    for (const user of demoUsers) {
      cachedHashes.set(user.email, await bcrypt.hash(user.password, 10))
    }
  }
  return cachedHashes
}

/**
 * Resets the user tables to just the two seeded demo accounts, with ids 1 and 2.
 * TRUNCATE ... RESTART IDENTITY resets the auto-increment sequences so the seeded
 * ids are deterministic on every run; CASCADE clears the tables that reference a
 * user (empty during tests). Call in beforeEach of any suite that touches the DB.
 */
export async function resetUsers(): Promise<void> {
  const hashes = await demoHashes()

  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Notification", "QueueEntry", "UserProfile", "UserCredential" RESTART IDENTITY CASCADE',
  )

  for (const user of demoUsers) {
    await prisma.userCredential.create({
      data: {
        email: user.email,
        passwordHash: hashes.get(user.email)!,
        role: user.role,
        profile: { create: { fullName: user.fullName, email: user.email } },
      },
    })
  }
}

/** Closes the database connection. Call once in afterAll of DB-touching suites. */
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect()
}
