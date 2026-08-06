import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { getMyProfile, putMyProfile } from './profile.controller'

const router = Router()

// A profile is private to its owner, so both routes require auth.
router.get('/', requireAuth, getMyProfile)
router.put('/', requireAuth, putMyProfile)

export default router
