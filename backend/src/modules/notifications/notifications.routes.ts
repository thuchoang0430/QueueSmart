import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { getNotifications, postMarkRead } from './notifications.controller'

const router = Router()

// Notifications are private to each user, so both routes require auth.
router.get('/', requireAuth, getNotifications)
router.post('/read', requireAuth, postMarkRead)

export default router
