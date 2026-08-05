import type { NextFunction, Request, Response } from 'express'
import { getProfile } from './profile.service'

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    // requireAuth guarantees req.user, so a user only ever reads their own
    // profile - the id is never taken from the request.
    res.json({ profile: await getProfile(req.user!.id) })
  } catch (err) {
    next(err)
  }
}
