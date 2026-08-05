import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth'
import {
  deleteServiceById,
  getService,
  getServices,
  patchServiceStatus,
  postService,
  putService,
} from './services.controller'

const router = Router()

// Public routes
router.get('/', getServices)
router.get('/:id', getService)

// Admin-only routes
router.post('/', requireAuth, requireRole('admin'), postService)
router.put('/:id', requireAuth, requireRole('admin'), putService)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin'),
  patchServiceStatus
)
router.delete('/:id', requireAuth, requireRole('admin'), deleteServiceById)

export default router
