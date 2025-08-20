import type { NextFunction, Response } from 'express'
import type { AuthRequest } from './authMiddleware'

export function permitRoles(...roles: Array<'user' | 'admin' | 'manager'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status (401).json({ message: 'Unauthorized' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status (403).json({ message: 'Forbidden: insufficient role' })
    }
    next()
  }
}
