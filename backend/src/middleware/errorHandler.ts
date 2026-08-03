import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../errors'

/** Every error response the API sends has this shape. */
export interface ErrorBody {
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  }
}

/** Runs when no route matched. Must be registered after all routers. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`No route for ${req.method} ${req.path}`))
}

/**
 * Central error handler. Express identifies it by its four arguments, so
 * `_next` has to stay in the signature even though it is unused.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    const body: ErrorBody = {
      error: { code: err.code, message: err.message },
    }
    if (err.fields) body.error.fields = err.fields
    res.status(err.status).json(body)
    return
  }

  // Malformed JSON is thrown by express.json() before any route runs.
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON.' },
    })
    return
  }

  const message = err instanceof Error ? err.message : 'Unexpected server error.'
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } })
}
