import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';

// ZodTypeAny rather than AnyZodObject: a schema carrying a cross-field
// `.refine()`/`.superRefine()` is a ZodEffects, not a ZodObject, and those are
// exactly the schemas that check one field against another.
export function validateRequest(schema: {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input parameters',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}
