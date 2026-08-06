import bcrypt from 'bcryptjs'
import { prisma } from '../src/database/prisma'

// Seeds the two demo accounts the A2 front end and the backend tests rely on:
//   user@test.com  / password  (regular user)
//   admin@test.com / password  (administrator)
// Passwords are stored only as bcrypt hashes - the plain text never touches the
// database. Run with `npm run db:seed`. It is idempotent: re-running updates the
// existing rows instead of failing on the unique email constraint.

const SALT_ROUNDS = 10

interface DemoUser {
  email: string
  password: string
  fullName: string
  role: 'USER' | 'ADMIN'
}

// Order matters on a fresh database: the first insert becomes id 1, the second
// id 2, matching the ids the not-yet-migrated history/notification seeds point
// at (userId: 1).
const demoUsers: DemoUser[] = [
  { email: 'user@test.com', password: 'password', fullName: 'Student User', role: 'USER' },
  { email: 'admin@test.com', password: 'password', fullName: 'Admin User', role: 'ADMIN' },
]

async function seed(): Promise<void> {
  for (const demo of demoUsers) {
    const passwordHash = await bcrypt.hash(demo.password, SALT_ROUNDS)

    await prisma.userCredential.upsert({
      where: { email: demo.email },
      update: { passwordHash, role: demo.role },
      create: {
        email: demo.email,
        passwordHash,
        role: demo.role,
        // The profile is created alongside the credential so a user is never
        // left with credentials but no profile.
        profile: {
          create: { fullName: demo.fullName, email: demo.email },
        },
      },
    })

    console.log(`Seeded ${demo.role.toLowerCase()} account: ${demo.email}`)
  }
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Seeding failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
