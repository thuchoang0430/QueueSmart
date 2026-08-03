import { Router } from "express";

import { requireAuth, requireRole } from "../../middleware/auth";

import {
  deleteLeaveQueue,
  getMyQueueStatus,
  getQueue,
  postJoinQueue,
  postServeNext,
} from "./queue.controller";

const router = Router();

// Middleware for every signed-in user.
const authenticated = [requireAuth];

// Middleware for admin-only routes.
const adminOnly = [requireAuth, requireRole("admin")];

// User
router.post("/:serviceId/join", ...authenticated, postJoinQueue);

router.delete("/:serviceId/leave", ...authenticated, deleteLeaveQueue);

router.get("/:serviceId/status", ...authenticated, getMyQueueStatus);

// Admin
router.get("/:serviceId", ...adminOnly, getQueue);

router.post("/:serviceId/serve", ...adminOnly, postServeNext);

export default router;
