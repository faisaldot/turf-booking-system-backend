import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt'

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
    const payload = verifyAccessToken(token) as { id?: string, role?: string }
    if (!payload?.id || !payload?.role) {
      return res.status(401).json({ message: 'Invalid token payload' })
    }

    req.user = { id: String(payload.id), role: payload.role as any }
    next()
  }
  catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
