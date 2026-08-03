import type { NextFunction, Request, Response } from 'express'
import { extractToken } from '../../middleware/auth'
import { login, logout, register, toPublicUser } from './auth.service'

export async function postRegister(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(register(req.body))
  } catch (err) {
    next(err)
  }
}

export async function postLogin(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(login(req.body))
  } catch (err) {
    next(err)
  }
}

/**
 * Lets the front end restore a session after a page refresh: it keeps the
 * token in localStorage and calls this on load to get the user back.
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    // requireAuth guarantees req.user is set before this runs.
    res.json({ user: toPublicUser(req.user!) })
  } catch (err) {
    next(err)
  }
}

export async function postLogout(req: Request, res: Response, next: NextFunction) {
  try {
    logout(extractToken(req))
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
