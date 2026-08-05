import type { NextFunction, Request, Response } from 'express'
import { getProfile, updateProfile } from './profile.service'

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    // requireAuth guarantees req.user, so a user only ever reads their own
    // profile - the id is never taken from the request.
    res.json({ profile: await getProfile(req.user!.id) })
  } catch (err) {
    next(err)
  }
}

export async function putMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ profile: await updateProfile(req.user!.id, req.body) })
  } catch (err) {
    next(err)
  }
}
