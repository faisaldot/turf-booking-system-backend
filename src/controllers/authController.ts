import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { User } from '../models/User'
import { loginSchema, registerSchema } from '../schemas/authSchema'

function signAccessToken(payload: object) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
}

// POST /api/v1/auth/register
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, phone } = registerSchema.parse(req.body)

    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(409).json({ message: 'Email already registered.' })
    }

    const user = await User.create({ name, email, password, phone })

    const token = signAccessToken({ id: user._id, role: user.role })

    res.status(201).json({
      message: 'Registered successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken: token,
    })
  }
  catch (error) {
    next(error)
  }
}

// POST /api/v1/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const ok = await user.comparePassword(password)
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = signAccessToken({ id: user._id, role: user.role })

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken: token,
    })
  }
  catch (err) {
    next(err)
  }
}
