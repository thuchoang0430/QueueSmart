/** Field name -> human readable reason. Returned to the front end as-is. */
export type FieldErrors = Record<string, string>

/**
 * Any error a route wants to turn into a specific HTTP response. Anything else
 * that reaches the error handler is treated as an unexpected 500.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: FieldErrors

  constructor(status: number, code: string, message: string, fields?: FieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  static badRequest(message: string, fields?: FieldErrors): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, fields)
  }

  static validation(fields: FieldErrors): ApiError {
    return new ApiError(400, 'VALIDATION_ERROR', 'One or more fields are invalid.', fields)
  }

  static unauthorized(message = 'Authentication is required.'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message)
  }

  static forbidden(message = 'You do not have permission to do that.'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message)
  }

  static notFound(message = 'Resource not found.'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message)
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, 'CONFLICT', message)
  }
}
