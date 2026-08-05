import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { getMyProfile } from './profile.controller'

const router = Router()

// A profile is private to its owner, so the route requires auth.
router.get('/', requireAuth, getMyProfile)

export default router
