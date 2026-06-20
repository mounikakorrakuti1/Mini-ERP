import type { NextFunction, Request, Response } from 'express';
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) =>
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || 'Internal server error' });
