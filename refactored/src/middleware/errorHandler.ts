import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Zod validation errors — 400 with field-level details
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const field = issue.path.join('.') || 'root';
      errors[field] = [...(errors[field] ?? []), issue.message];
    }
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  // Known application errors
  if (err instanceof ApiError) {
    logger.warn(`[${err.statusCode}] ${err.message}`, { path: req.path, method: req.method });
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Unexpected errors
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
