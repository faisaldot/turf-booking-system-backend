import type { Request, Response } from 'express'
import { User } from '../models/User'
import { loginSchema, registerSchema } from '../schemas/authSchema'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'

// POST /api/v1/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = registerSchema.parse(req.body)

  const exists = await User.findOne({ email })
  if (exists) {
    throw new AppError('Email already registered', 409)
  }

  const user = await User.create({ name, email, password, phone })

  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  res.status(201).json({
    message: 'Registered successfully',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  })
})

// POST /api/v1/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)

  const user = await User.findOne({ email })
  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  const ok = await user.comparePassword(password)
  if (!ok) {
    throw new AppError('Invalid email or password', 401)
  }

  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  res.json({
    message: 'Login successful',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  })
})

// POST /api/v1/auth/refresh-token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string }
  if (!refreshToken) {
    throw new AppError('Refresh token required', 400)
  }

  const payload = verifyRefreshToken(refreshToken) as any

  const user = await User.findById(payload.id)
  if (!user) {
    throw new AppError('User not found', 401)
  }

  const newAccessToken = signAccessToken({ id: user._id, role: user.role })
  res.json({ accessToken: newAccessToken })
})
