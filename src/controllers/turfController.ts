import type { Request, Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import mongoose from 'mongoose'
import { Turf } from '../models/Turf'
import { User } from '../models/User'
import { createTurfSchema, updatedTurfSchema } from '../schemas/turfSchema'
import { createTurf, deactivateTurf, findTurf, findTurfById, findTurfBySlug, updateTurf } from '../services/turfServices'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'
import { paginate } from '../utils/pagination'

// Create turf controller - FIXED with admin validation
export const createTurfHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('🏟️ Creating new turf...')
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2))

  const validate = createTurfSchema.parse(req.body)

  // FIXED: Validate and convert admin IDs to ObjectIds
  let adminIds: mongoose.Types.ObjectId[] = []

  if (validate.admins && Array.isArray(validate.admins)) {
    console.log('👥 Processing admin IDs:', validate.admins)

    // Validate each admin ID
    for (const adminId of validate.admins) {
      // Check if it's a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new AppError(`Invalid admin ID format: ${adminId}`, 400)
      }

      // Check if the admin exists
      const admin = await User.findById(adminId)
      if (!admin) {
        throw new AppError(`Admin not found with ID: ${adminId}`, 404)
      }

      // Check if the user is actually an admin
      if (admin.role !== 'admin' && admin.role !== 'manager') {
        throw new AppError(`User ${adminId} is not an admin or manager`, 400)
      }

      adminIds.push(new mongoose.Types.ObjectId(adminId))
    }

    console.log('✅ Valid admin IDs:', adminIds)
  }

  // If no admins provided or empty array, use the creator (manager) as the admin
  if (adminIds.length === 0) {
    console.log('👤 No admins provided, using creator as admin:', req.user?.id)
    adminIds = [new mongoose.Types.ObjectId(req.user?.id)]
  }

  // FIXED: Create turf data with properly formatted admin IDs
  const turfData = {
    ...validate,
    admins: adminIds,
  }

  console.log('📝 Creating turf with data:', JSON.stringify(turfData, null, 2))

  const turf = await createTurf(turfData as any)

  console.log('✅ Turf created successfully:', turf._id)

  res.status(201).json({
    message: 'Turf created successfully',
    data: turf,
  })
})

// Get all turf controller
export const getAllTurfsHandler = asyncHandler(async (req: Request, res: Response) => {
  // Only active turfs should be public
  const filters = { isActive: true }

  const result = await paginate(Turf, req, filters)

  res.status(200).json({
    message: 'Turfs retrieved successfully.',
    ...result,
  })
})

// Get individual turf controller
export const getTurfHandler = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params
  const turf = await findTurfBySlug(slug)

  if (!turf) {
    throw new AppError('Turf not found', 404)
  }
  res.json({
    message: 'Turf retrieved successfully.',
    data: turf,
  })
})

// Flexible handler that works with both slug and ID
export const getTurfFlexibleHandler = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params // Can be either slug or ID

  const turf = await findTurf(identifier)

  if (!turf) {
    throw new AppError('Turf not found', 404)
  }

  res.json({
    message: 'Turf retrieved successfully.',
    data: turf,
  })
})

// Update turf controller - FIXED: Better authorization check
export const updateTurfHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: turfId } = req.params
  console.log('🔧 Updating turf:', turfId)
  console.log('👤 User:', req.user?.id, 'Role:', req.user?.role)

  const validate = updatedTurfSchema.parse(req.body)

  const existingTurf = await findTurfById(turfId)
  if (!existingTurf) {
    throw new AppError('Turf not found', 404)
  }

  // FIXED: Check if user is authorized to update this turf
  const isAdminForThisTurf = existingTurf.admins.some(
    adminId => adminId.toString() === req.user!.id,
  )

  if (req.user?.role !== 'manager' && !isAdminForThisTurf) {
    throw new AppError('Forbidden: you do not manage this turf', 403)
  }

  // FIXED: If updating admins, validate them
  if (validate.admins && Array.isArray(validate.admins)) {
    const adminIds: mongoose.Types.ObjectId[] = []

    for (const adminId of validate.admins) {
      if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new AppError(`Invalid admin ID format: ${adminId}`, 400)
      }

      const admin = await User.findById(adminId)
      if (!admin) {
        throw new AppError(`Admin not found with ID: ${adminId}`, 404)
      }

      if (admin.role !== 'admin' && admin.role !== 'manager') {
        throw new AppError(`User ${adminId} is not an admin or manager`, 400)
      }

      adminIds.push(new mongoose.Types.ObjectId(adminId))
    }

    validate.admins = adminIds as any
  }

  // If updating name, regenerate slug
  if (validate.name) {
    // eslint-disable-next-line ts/no-require-imports
    const slugify = require('slugify')
    validate.slug = slugify(validate.name, { lower: true, strict: true })
  }

  const updatedTurf = await updateTurf(turfId, validate)

  console.log('✅ Turf updated successfully')

  res.json({
    message: 'Turf updated successfully.',
    data: updatedTurf,
  })
})

// Deactivate turf controller (soft delete)
export const deleteTurfHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: turfId } = req.params

  const existingTurf = await findTurfById(turfId)
  if (!existingTurf || !existingTurf.isActive) {
    throw new AppError('Turf not found', 404)
  }

  // Authorization check
  const isAdminForThisTurf = existingTurf.admins.some(
    adminId => adminId.toString() === req.user!.id,
  )

  if (req.user?.role !== 'manager' && !isAdminForThisTurf) {
    throw new AppError('Forbidden: you do not manage this turf', 403)
  }

  await deactivateTurf(turfId)

  res.json({
    message: 'Turf deactivated successfully.',
  })
})

// NEW: Get turfs for admin dashboard
export const getAdminTurfsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('🏟️ Fetching turfs for admin:', req.user?.id)

  let filters = {}

  // If the user is an admin (not manager), only show their turfs
  if (req.user?.role === 'admin') {
    filters = { admins: req.user.id }
  }
  // Managers can see all turfs (no filter needed)

  const result = await paginate(Turf, req, filters)

  console.log('✅ Found turfs:', result.data.length)

  res.status(200).json({
    message: 'Turfs retrieved successfully.',
    ...result,
  })
})
