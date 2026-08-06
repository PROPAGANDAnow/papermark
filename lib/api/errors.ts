const ERROR_STATUS_CODES = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  unprocessable_entity: 422,
  too_many_requests: 429,
  internal_server_error: 500,
} as const;

/** Stable, safe-to-return error codes for public API responses and usage logs. */
export type ErrorCode = keyof typeof ERROR_STATUS_CODES;

export type ApiErrorResponse = {
  status: number;
  body: {
    error: string;
    code: ErrorCode;
  };
};

/**
 * An API error whose message has been deliberately selected for clients.
 * Do not pass provider, database, or other internal error messages here.
 */
export class PapermarkApiError extends Error {
  public readonly statusCode: number;

  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PapermarkApiError";
    this.statusCode = ERROR_STATUS_CODES[code];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Convert unknown failures into a response that never leaks internal details.
 * Only messages from {@link PapermarkApiError} are safe to return to clients.
 */
export function getApiErrorResponse(
  error: unknown,
  fallback: ApiErrorResponse = {
    status: ERROR_STATUS_CODES.internal_server_error,
    body: {
      error: "Internal Server Error",
      code: "internal_server_error",
    },
  },
): ApiErrorResponse {
  if (error instanceof PapermarkApiError) {
    return {
      status: error.statusCode,
      body: {
        error: error.message,
        code: error.code,
      },
    };
  }

  return fallback;
}
