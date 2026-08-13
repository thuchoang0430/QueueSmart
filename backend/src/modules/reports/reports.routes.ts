import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth'
import { getHistoryReport, getReport } from './reports.controller'

const router = Router()

// Reporting is admin-only: requireAuth first (401 if we don't know who you are),
// then requireRole('admin') (403 if you're a signed-in non-admin).
router.get('/', requireAuth, requireRole('admin'), getReport)
router.get('/history', requireAuth, requireRole('admin'), getHistoryReport)

export default router
