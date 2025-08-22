import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { User } from '../models/User'
import { createAdminSchema, updateUserStatusSchema } from '../schemas/userSchema'
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

// PATCH /api/v1/users/:id/status
export const updateUserStatusHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { isActive } = updateUserStatusSchema.parse(req.body)
  const { id: userId } = req.params

  if (req.user?.id === userId) {
    throw new AppError('You cannot deactivate your own account', 400)
  }

  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  user.isActive = isActive
  await user.save()

  const { password: _, ...userResponse } = user.toObject()

  res.status(200).json({
    message: `User account has been ${isActive ? 'activated' : 'deactivated'}.`,
    user: userResponse,
  })
})
