import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public fields?: Record<string, string[]>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super(400, message, 'VALIDATION_ERROR', fields);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(409, message, 'CONFLICT_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(403, message, 'FORBIDDEN_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database constraint error') {
    super(422, message, 'DATABASE_ERROR');
  }
}

export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let fields: Record<string, string[]> | undefined;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    fields = err.fields;
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    fields = err.flatten().fieldErrors;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 400;
      code = 'CONFLICT_ERROR';
      message = 'Unique constraint failed';
      fields = { [(err.meta?.target as string[])?.[0] || 'field']: ['Already exists'] };
    } else if (err.code === 'P2003') {
      status = 400;
      code = 'DATABASE_ERROR';
      message = 'Foreign key constraint failed';
    } else if (err.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'Record not found';
    }
  }

  // Hide stack trace and unhandled messages in production
  if (status === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  } else if (status === 500 && process.env.NODE_ENV !== 'production') {
    message = err.message || message;
  }

  res.status(status).json({
    data: null,
    meta: null,
    error: {
      code,
      message,
      ...(fields && { fields }),
    },
  });
};
