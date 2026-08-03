export type FieldErrors = Record<string, string>;

//  * This is an error that the app expects.
//  * It sends a specific HTTP status and message to the client.
//  * Other unexpected errors are handled as 500 server errors.

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: FieldErrors;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: FieldErrors,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  //  * Creates a 400 Bad Request error.

  static badRequest(message: string, fields?: FieldErrors): ApiError {
    return new ApiError(400, "BAD_REQUEST", message, fields);
  }

  //  * Creates a 400 validation error with field-level messages.

  static validation(fields: FieldErrors): ApiError {
    return new ApiError(
      400,
      "VALIDATION_ERROR",
      "One or more fields are invalid.",
      fields,
    );
  }

  //  * Creates a 401 Unauthorized error.

  static unauthorized(message = "Authentication is required."): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  //  * Creates a 403 Forbidden error.

  static forbidden(
    message = "You do not have permission to do that.",
  ): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }

  //  * Creates a 404 Not Found error.

  static notFound(message = "Resource not found."): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }

  //  * Creates a 409 Conflict error.

  static conflict(message: string): ApiError {
    return new ApiError(409, "CONFLICT", message);
  }
}
