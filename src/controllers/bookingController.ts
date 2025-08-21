import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'

import { Turf } from '../models/Turf'
import { createBookingSchema } from '../schemas/bookingSchema'
import { createBooking, findBookingById, findBookingByUser, getTurfAvailability } from '../services/bookingServices'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

export const createBookingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validate = createBookingSchema.parse(req.body) as any
  const newBooking = await createBooking({
    ...validate,
    user: req.user?.id,
  })
  res.status(201).json(newBooking)
})

export const getMyBookingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await findBookingByUser(req.user?.id as any)
  res.json(booking)
})

export const getMyBookingDetailsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await findBookingById(req.params.id) as any
  if (!booking) {
    throw new AppError('Booking not found', 404)
  }

  const turf = await Turf.findById(booking.turf)

  const isOwner = String(booking.user) === req.user?.id
  const isAdmin = turf && String(turf.managedBy) === req.user?.id
  const isManager = req.user!.role === 'manager'

  if (!isOwner && !isAdmin && !isManager) {
    throw new AppError('Forbidden', 403)
  }
  res.json(booking)
})

export const getTurfAvailabilityHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date } = req.query
  if (!date) {
    throw new AppError('Date query parameter is required', 400)
  }

  const availability = await getTurfAvailability(req.params.id, new Date(date as string))
  res.json(availability)
})
