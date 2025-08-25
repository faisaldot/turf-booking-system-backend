import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { User } from '../models/User'
import { createAdminSchema, updateUserSchema, updateUserStatusSchema } from '../schemas/userSchema'
import { getAdminDashboardStats, getManagerDashboardStats } from '../services/dashboardService'
import { updateUserById } from '../services/userServices'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'
import { paginate } from '../utils/pagination'

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

// GET /api/v1/admin/dashboard
export const getAdminDashboardHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  let stats

  // if the user is a manager, get platform-wide stats.
  if (req.user!.role === 'manager') {
    stats = await getManagerDashboardStats()
  }
  else {
    // otherwise, get stats only for the turfs this admin manages
    const adminId = req.user!.id
    stats = await getAdminDashboardStats(adminId)
  }

  res.status(200).json({
    message: 'Dashboard statistics retrieved successfully.',
    data: stats,
  })
})

// GET /api/v1/admin/users
export const getAllUsersHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await paginate(User, req)

  res.status(200).json({
    message: 'Users retrieved successfully.',
    ...result,
  })
})

// PATCH /api/v1/admin/users/:id
export const updateUserHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: userId } = req.params
  const validatedData = updateUserSchema.parse(req.body)

  if (Object.keys(validatedData).length === 0) {
    throw new AppError('No update data provided.', 400)
  }

  // Prevent a manager from accidentally deactivating or changing their own role
  if (req.user?.id === userId) {
    throw new AppError('Managers cannot alter their own status or role.', 403)
  }

  const updatedUser = await updateUserById(userId, validatedData)

  if (!updatedUser) {
    throw new AppError('User not found.', 404)
  }

  res.status(200).json({
    message: 'User updated successfully.',
    data: updatedUser,
  })
})
