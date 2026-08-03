import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { ApiError } from '../errors'
import { getUserByToken } from '../modules/auth/auth.service'
import type { Role, User } from '../store/memoryStore'

// Adds `req.user` to Express's Request type so routes behind requireAuth can
// read the caller without casting.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

/** Pulls the token out of `Authorization: Bearer <token>`. */
export function extractToken(req: Request): string | undefined {
  const header = req.header('authorization')
  if (!header) return undefined

  const [scheme, token] = header.split(' ')
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return undefined
  return token
}

/** Rejects the request with 401 unless a valid token is present. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const user = getUserByToken(extractToken(req))
  if (!user) {
    next(ApiError.unauthorized('You must be signed in to do that.'))
    return
  }

  req.user = user
  next()
}

/**
 * Rejects the request with 403 when the signed-in user has the wrong role.
 * Always chain it after requireAuth: `router.post('/', requireAuth, requireRole('admin'), handler)`.
 *
 * 401 vs 403 matters here - 401 means "we do not know who you are", 403 means
 * "we know, and you are not allowed".
 */
export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(ApiError.unauthorized('You must be signed in to do that.'))
      return
    }

    if (req.user.role !== role) {
      next(ApiError.forbidden(`This action requires the ${role} role.`))
      return
    }

    next()
  }
}
