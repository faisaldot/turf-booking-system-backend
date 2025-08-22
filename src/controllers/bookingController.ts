import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'

import { Booking } from '../models/Booking'
import { Turf } from '../models/Turf'
import { createBookingSchema } from '../schemas/bookingSchema'
import { createBooking, findBookingById, findBookingByUser, getTurfAvailability } from '../services/bookingServices'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

// Creating booking handler
export const createBookingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validate = createBookingSchema.parse(req.body) as any

  // Check if the time slot is already booked
  const existingBooking = await Booking.findOne({
    turf: validate.turf,
    date: validate.date,
    startTime: validate.startTime,
    status: { $ne: 'cancelled' },
  })

  if (existingBooking) {
    throw new AppError('This time slot is already booked for the selected date', 409)
  }

  const newBooking = await createBooking({
    ...validate,
    user: req.user?.id,
  })
  res.status(201).json(newBooking)
})

// Get my booking handler
export const getMyBookingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const booking = await findBookingByUser(req.user?.id as any)
  res.json(booking)
})

// Get my booking details handler
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

// Get turf availability handler
export const getTurfAvailabilityHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date } = req.query
  if (!date) {
    throw new AppError('Date query parameter is required', 400)
  }

  const availability = await getTurfAvailability(req.params.id, new Date(date as string))
  res.json(availability)
})
