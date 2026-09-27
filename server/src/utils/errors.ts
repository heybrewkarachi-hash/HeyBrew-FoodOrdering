export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export function badRequest(code: string, message: string, details?: unknown): AppError {
  return new AppError(400, code, message, details);
}

export function unauthorized(code = "UNAUTHORIZED", message = "Unauthorized"): AppError {
  return new AppError(401, code, message);
}

export function forbidden(code = "FORBIDDEN", message = "Forbidden"): AppError {
  return new AppError(403, code, message);
}

export function notFound(code = "NOT_FOUND", message = "Not found"): AppError {
  return new AppError(404, code, message);
}

export function conflict(code: string, message: string, details?: unknown): AppError {
  return new AppError(409, code, message, details);
}

export function tooMany(code = "RATE_LIMITED", message = "Too many requests"): AppError {
  return new AppError(429, code, message);
}
