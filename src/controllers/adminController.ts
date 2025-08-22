import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { User } from '../models/User'
import { createAdminSchema } from '../schemas/userSchema'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

// POST /api/v1/users/admin
export const createAdminHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password, phone } = createAdminSchema.parse(req.body)

  // Check if an admin with this email already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new AppError('A user with this email already exists.', 409)
  }

  // Create the new user with the 'admin' role
  const adminUser = await User.create({ name, email, password, phone, role: 'admin' })

  // Exclude password from the response
  const { password: _, ...userResponse } = adminUser.toObject()

  res.status(201).json({
    message: 'Admin account created successfully.',
    user: userResponse,
  })
})
