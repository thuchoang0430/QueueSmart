import type { NextFunction, Request, Response } from 'express'
import { getUserHistory } from './history.service'

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    // requireAuth guarantees req.user is set, so a user only ever sees their
    // own history - the id is never read from the request.
    res.json({ history: getUserHistory(req.user!.id) })
  } catch (err) {
    next(err)
  }
}
