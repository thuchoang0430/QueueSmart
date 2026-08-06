import bcrypt from 'bcryptjs'
import { prisma } from '../src/database/prisma'

const SALT_ROUNDS = 10

interface DemoUser {
  email: string
  password: string
  fullName: string
  role: 'USER' | 'ADMIN'
}

interface DemoService {
  name: string
  description: string
  expectedDuration: number
  priorityLevel: number
}

const demoUsers: DemoUser[] = [
  {
    email: 'user@test.com',
    password: 'password',
    fullName: 'Student User',
    role: 'USER',
  },
  {
    email: 'admin@test.com',
    password: 'password',
    fullName: 'Admin User',
    role: 'ADMIN',
  },
]

const demoServices: DemoService[] = [
  {
    name: 'Academic Advising',
    description:
      'General academic guidance and course planning for students.',
    expectedDuration: 20,
    priorityLevel: 2,
  },
  {
    name: 'Financial Aid',
    description:
      'Assistance with financial aid applications and questions.',
    expectedDuration: 30,
    priorityLevel: 3,
  },
  {
    name: 'IT Help Desk',
    description:
      'Technical support for student accounts, devices, and campus wifi.',
    expectedDuration: 15,
    priorityLevel: 1,
  },
]

async function seedUsers(): Promise<void> {
  for (const demo of demoUsers) {
    const passwordHash = await bcrypt.hash(
      demo.password,
      SALT_ROUNDS,
    )

    await prisma.userCredential.upsert({
      where: {
        email: demo.email,
      },
      update: {
        passwordHash,
        role: demo.role,
        profile: {
          upsert: {
            update: {
              fullName: demo.fullName,
              email: demo.email,
            },
            create: {
              fullName: demo.fullName,
              email: demo.email,
            },
          },
        },
      },
      create: {
        email: demo.email,
        passwordHash,
        role: demo.role,
        profile: {
          create: {
            fullName: demo.fullName,
            email: demo.email,
          },
        },
      },
    })

    console.log(
      `Seeded ${demo.role.toLowerCase()} account: ${demo.email}`,
    )
  }
}

async function seedServices(): Promise<void> {
  const existingServices =
    await prisma.service.findMany({
      select: {
        id: true,
        name: true,
      },
    })

  for (const demo of demoServices) {
    const existing = existingServices.find(
      (service) =>
        service.name.toLowerCase() ===
        demo.name.toLowerCase(),
    )

    const service = existing
      ? await prisma.service.update({
          where: {
            id: existing.id,
          },
          data: {
            name: demo.name,
            description: demo.description,
            expectedDuration:
              demo.expectedDuration,
            priorityLevel:
              demo.priorityLevel,
          },
        })
      : await prisma.service.create({
          data: {
            name: demo.name,
            description: demo.description,
            expectedDuration:
              demo.expectedDuration,
            priorityLevel:
              demo.priorityLevel,
          },
        })

    const latestQueue =
      await prisma.queue.findFirst({
        where: {
          serviceId: service.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

    if (latestQueue) {
      await prisma.queue.update({
        where: {
          id: latestQueue.id,
        },
        data: {
          status: 'OPEN',
        },
      })
    } else {
      await prisma.queue.create({
        data: {
          serviceId: service.id,
          status: 'OPEN',
        },
      })
    }

    console.log(
      `Seeded service: ${service.name}`,
    )
  }
}

async function seed(): Promise<void> {
  await seedUsers()
  await seedServices()
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('Seeding failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
