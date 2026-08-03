import cors from 'cors'
import express, { type Express } from 'express'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import authRoutes from './modules/auth/auth.routes'
import historyRoutes from './modules/history/history.routes'
import notificationsRoutes from './modules/notifications/notifications.routes'
import queueRoutes from './modules/queues/queues.routes'
import servicesRoutes from './modules/services/services.routes'

/**
 * Builds the Express app without starting a server, so Supertest can drive it
 * in tests. `index.ts` is the only place that calls listen().
 */
export function createApp(): Express {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/services', servicesRoutes)
  app.use('/api/queues', queueRoutes)
  app.use('/api/history', historyRoutes)
  app.use('/api/notifications', notificationsRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
