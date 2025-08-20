import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AuthRequest extends Request {
  user?: { id: string, role: 'user' | 'admin' | 'manager' }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.split(' ')[1] : undefined
  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload
    req.user = { id: payload.id, role: payload.role }
    next()
  }
  catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
