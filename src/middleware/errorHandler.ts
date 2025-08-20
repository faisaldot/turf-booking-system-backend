import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import AppError from '../utils/AppError'

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: 'Route not found' })
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map(e => ({ path: e.path, message: e.message })),
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message })
  }

  console.error(err)
  return res.status(500).json({ message: 'Internal Server Error' })
}
