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

router.post("/:serviceId/join", requireAuth, postJoinQueue);

router.delete("/:serviceId/leave", requireAuth, deleteLeaveQueue);

router.get("/:serviceId/status", requireAuth, getMyQueueStatus);

router.get("/:serviceId", requireAuth, requireRole("admin"), getQueue);

router.post(
  "/:serviceId/serve",
  requireAuth,
  requireRole("admin"),
  postServeNext,
);

export default router;
