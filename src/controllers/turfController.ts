import type { Request, Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { createTurfSchema, updatedTurfSchema } from '../schemas/turfSchema'
import { createTurf, findTurfBySlug, findTurfs, removeTurf, updateTurf } from '../services/turfServices'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

// Create turf controller
export const createTurfHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validate = createTurfSchema.parse(req.body)
  const turf = await createTurf({ ...validate, managedBy: req.user?.id } as any)
  res.status(201).json(turf)
})

// Get all turf controller
export const getAllTurfsHandler = asyncHandler(async (req: Request, res: Response) => {
  const turfs = await findTurfs(req.body as any)
  res.json(turfs)
})

// Get individual turf controller
export const getTurfHandler = asyncHandler(async (req: Request, res: Response) => {
  const turf = await findTurfBySlug(req.params.id)
  if (!turf) {
    throw new AppError('Turf not found', 404)
  }
  res.json(turf)
})

// Update turf controller
export const updateTurfHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validate = updatedTurfSchema.parse(req.body)
  const turf = await findTurfBySlug(req.params.id)
  if (!turf) {
    throw new AppError('Turf not found', 404)
  }

  // Only manager or the admin who manage this turf
  if (req.user?.role !== 'manager' && String(turf.managedBy) !== String(req.user?.id)) {
    throw new AppError('Forbidden: you do not manage this turf', 403)
  }

  const updated = await updateTurf(req.params.id, validate as any)

  res.json(updated)
})

// Delete turf controller
export const deleteTurfHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const turf = await findTurfBySlug(req.params.id)
  if (!turf) {
    throw new AppError('Turf not found', 404)
  }

  if (req.user?.role !== 'manager' && String(turf.managedBy) !== String(req.user?.id)) {
    throw new AppError('Forbidden: you do not manage this turf', 403)
  }

  await removeTurf(req.params.id)
  res.json({ message: 'Turf deleted' })
})
