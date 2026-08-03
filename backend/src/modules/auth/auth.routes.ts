import { Router } from 'express'
import { requireAuth } from '../../middleware/auth'
import { getMe, postLogin, postLogout, postRegister } from './auth.controller'

const router = Router()

router.post('/register', postRegister)
router.post('/login', postLogin)
router.get('/me', requireAuth, getMe)
router.post('/logout', requireAuth, postLogout)

export default router
