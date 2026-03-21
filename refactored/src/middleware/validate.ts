import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Middleware factory that validates the given request part against a Zod schema.
 * On success, replaces the part with the parsed (coerced) value.
 * On failure, passes a ZodError to the next error handler.
 */
export const validate =
  (schema: ZodSchema, part: RequestPart = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(result.error);
    } else {
      (req as unknown as Record<string, unknown>)[part] = result.data;
      next();
    }
  };
