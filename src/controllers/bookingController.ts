import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'

import { Booking } from '../models/Booking'
import { Turf } from '../models/Turf'
import { createBookingSchema, updateBookingStatusSchema } from '../schemas/bookingSchema'
import { createBooking, findBookingById, findBookingByUser, getTurfAvailability, updateBookingStatus } from '../services/bookingServices'
import { calculateBookingPrice } from '../services/turfPricingService'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

// Creating booking handler
export const createBookingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedInput = createBookingSchema.parse(req.body)

  //  Find the turf to get its pricing rules
  const turf = await Turf.findById(validatedInput.turf)
  if (!turf) {
    throw new AppError('Turf not found', 404)
  }

  //  Check if the time slot is already booked
  const existingBooking = await Booking.findOne({
    turf: validatedInput.turf,
    date: validatedInput.date,
    startTime: validatedInput.startTime,
    status: { $ne: 'cancelled' },
  })

  if (existingBooking) {
    throw new AppError('This time slot is already booked for the selected date', 409)
  }

  //  Calculate the price using the new service
  const pricingDetails = calculateBookingPrice(
    turf,
    validatedInput.date,
    validatedInput.startTime,
    validatedInput.endTime,
  )

  // 4. Create the booking with server-calculated price details
  const newBookingData = {
    ...validatedInput,
    user: req.user!.id,
    appliedPricePerSlot: pricingDetails.pricePerSlot,
    totalPrice: pricingDetails.totalPrice,
    pricingRule: pricingDetails.appliedRule,
    dayType: pricingDetails.dayType,
    paymentStatus: 'unpaid', // explicitly set default
  } as any

  const newBooking = await createBooking(newBookingData)

  // 5. Send a detailed response as per the documentation
  res.status(201).json({
    message: 'Booking created successfully. Please proceed to payment.',
    booking: newBooking,
    pricing: {
      pricePerSlot: pricingDetails.pricePerSlot,
      duration: pricingDetails.durationInHours,
      totalPrice: pricingDetails.totalPrice,
      appliedRule: pricingDetails.appliedRule,
    },
  })
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

  if (!turf) {
    throw new AppError('Associated turf not found', 404)
  }

  const isOwner = booking.user.equals(req.user!.id)
  const isAdmin = turf.admins.some(adminId => adminId.equals(req.user!.id))
  const isManager = req.user!.role === 'manager'

  if (!isOwner && !isAdmin && !isManager) {
    throw new AppError('Forbidden: You do not have permission to view this booking', 403)
  }
  res.json(booking)
})

// Get turf availability handler
export const getTurfAvailabilityHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date } = req.query
  if (!date || typeof date !== 'string') {
    throw new AppError('Date query parameter is required', 400)
  }

  const availability = await getTurfAvailability(req.params.id, new Date(date as string))
  res.json(availability)
})

// Update booking status handler
export const updateBookingStatusHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = updateBookingStatusSchema.parse(req.body)
  const { id: bookingId } = req.params

  const booking = await findBookingById(bookingId)
  if (!booking) {
    throw new AppError('Booking not found', 404)
  }

  // Authorization check: Only a manager or the admin of the specific turf can update the status.
  const turf = await Turf.findById(booking.turf)

  const isAdminOfThisTurf = turf && turf.admins.some(adminId => adminId.equals(req.user!.id))

  if (req.user!.role !== 'manager' && !isAdminOfThisTurf) {
    throw new AppError('Forbidden: You are not authorized to perform this action.', 403)
  }

  const updatedBooking = await updateBookingStatus(bookingId, status)

  res.json(updatedBooking)
})
