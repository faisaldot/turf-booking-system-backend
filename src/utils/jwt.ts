import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import AppError from './AppError'
import { isBlockListed } from './tokenBlockList'

export function signAccessToken(payload: object) {
  // @ts-ignore
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
}

export function signRefreshToken(payload: object) {
  // @ts-ignore
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_EXPIRES_IN })
}

export function verifyAccessToken(token: string): any {
  if (isBlockListed(token)) {
    throw new AppError('Token has been revoked', 401)
  }

  try {
    return jwt.verify(token, env.JWT_SECRET)
  }
  catch {
    throw new AppError('Invalid or expired token', 401)
  }
}

export function verifyRefreshToken(token: string): any {
  if (isBlockListed(token)) {
    throw new AppError('Token has been revoked', 401)
  }
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET)
  }
  catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }
}
