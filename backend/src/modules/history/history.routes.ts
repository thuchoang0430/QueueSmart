import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { getHistory } from './history.controller'

const router = Router()

// A user's history is private to them, so this is behind requireAuth.
router.get('/', requireAuth, getHistory)

export default router
