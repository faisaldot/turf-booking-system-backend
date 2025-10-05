import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import AppError from '../utils/AppError'
import { logger } from '../utils/logger'

// Not found handler
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: 'Route not found' })
}

// Enhanced error handler
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const errorId = crypto.randomUUID()

  // Log with structured data
  logger.error('Application Error', {
    errorId,
    error: err,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })

  if (err instanceof ZodError) {
    return res.status(400).json({
      errorId,
      message: 'Validation failed',
      errors: err.issues.map(e => ({ path: e.path, message: e.message })),
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      errorId,
      message: err.message,
    })
  }

  return res.status(500).json({
    errorId,
    message: 'Internal Server Error',
  })
}
