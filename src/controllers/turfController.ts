import type { Request, Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { Turf } from '../models/Turf'
import { createTurfSchema, updatedTurfSchema } from '../schemas/turfSchema'
import { createTurf, deactivateTurf, findTurfById, updateTurf } from '../services/turfServices'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'
import { paginate } from '../utils/pagination'

// Create turf controller
export const createTurfHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validate = createTurfSchema.parse(req.body)
  // The creator of the turf is automatically the first admin
  const turfData = { ...validate, admins: [req.user?.id] }

  const turf = await createTurf(turfData as any)
  res.status(201).json(turf)
})

// Get all turf controller
export const getAllTurfsHandler = asyncHandler(async (req: Request, res: Response) => {
  // Only active turfs should be public
  const filters = { isActive: true }

  const result = await paginate(Turf, req, filters)

  res.status(200).json({
    message: 'Turfs retrived successfully.',
    ...result,
  })
})

// Get individual turf controller
export const getTurfHandler = asyncHandler(async (req: Request, res: Response) => {
  const turf = await findTurfById(req.params.id)
  if (!turf || !turf.isActive) {
    throw new AppError('Turf not found', 404)
  }
  res.json(turf)
})

// Update turf controller
export const updateTurfHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validate = updatedTurfSchema.parse(req.body)
  const turf = await findTurfById(req.params.id)
  if (!turf || !turf?.isActive) {
    throw new AppError('Turf not found', 404)
  }

  // Only manager or the admin who manage this turf
  const isAdminForThisTurf = turf.admins.some(adminId => adminId.equals(req.user?.id))

  if (req.user?.role !== 'manager' && !isAdminForThisTurf) {
    throw new AppError('Forbidden: you do not manage this turf', 403)
  }

  const updated = await updateTurf(req.params.id, validate as any)

  res.json(updated)
})

// Delete turf controller
export const deleteTurfHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const turf = await findTurfById(req.params.id)
  if (!turf || !turf.isActive) {
    throw new AppError('Turf not found', 404)
  }

  const isAdminForThisTurf = turf.admins.some(adminId => adminId.equals(req.user?.id))
  if (req.user?.role !== 'manager' && !isAdminForThisTurf) {
    throw new AppError('Forbidden: you do not manage this turf', 403)
  }

  await deactivateTurf(req.params.id)
  res.status(200).json({ message: 'Turf deactivated successfully' })
})
