import type { Request, Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { createTurfSchema, updatedTurfSchema } from '../schemas/turfSchema'
import { createTurf, deactivateTurf, findTurfById, findTurfs, updateTurf } from '../services/turfServices'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

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
  const turfs = await findTurfs(req.query)
  res.json(turfs)
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
