import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";
import { apiError } from "@heybrew/shared";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(apiError(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json(
      apiError("VALIDATION_ERROR", "Invalid request", err.flatten())
    );
    return;
  }

  logger.error("Unhandled error", {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json(apiError("INTERNAL_ERROR", "Internal server error"));
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req.query);
    (req as Request & { validatedQuery: T }).validatedQuery = parsed;
    next();
  };
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(apiError("NOT_FOUND", "Route not found"));
}
