import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'

import { Booking } from '../models/Booking'
import { Turf } from '../models/Turf'
import { createBookingSchema, updateBookingStatusSchema } from '../schemas/bookingSchema'
import { createBooking, findBookingById, findBookingByUser, getTurfAvailability, updateBookingStatus } from '../services/bookingServices'
import { calculateBookingPrice } from '../services/turfPricingService'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

// Creating booking handler - COMPLETELY FIXED
export const createBookingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedInput = createBookingSchema.parse(req.body)

  // Find the turf to get its pricing rules
  const turf = await Turf.findById(validatedInput.turf)
  if (!turf) {
    throw new AppError('Turf not found', 404)
  }

  // FIXED: Proper availability check
  // - Always block confirmed bookings (regardless of payment status)
  // - Only block recent pending bookings (within 15 minutes)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  const conflictingBooking = await Booking.findOne({
    turf: validatedInput.turf,
    date: validatedInput.date,
    startTime: validatedInput.startTime,
    $or: [
      { status: 'confirmed' }, // Always blocked if confirmed
      {
        status: 'pending',
        createdAt: { $gte: fifteenMinutesAgo }, // Only recent pending bookings
      },
    ],
  })

  if (conflictingBooking) {
    const message = conflictingBooking.status === 'confirmed'
      ? 'This time slot is already booked and confirmed'
      : 'This time slot is temporarily reserved. Please try again in a few minutes.'
    throw new AppError(message, 409)
  }

  // Calculate the price using the pricing service
  const pricingDetails = calculateBookingPrice(
    turf,
    validatedInput.date,
    validatedInput.startTime,
    validatedInput.endTime,
  )

  // Create pending booking with 15-minute expiration
  const newBookingData = {
    ...validatedInput,
    user: req.user!.id,
    appliedPricePerSlot: pricingDetails.pricePerSlot,
    totalPrice: pricingDetails.totalPrice,
    pricingRule: pricingDetails.appliedRule,
    dayType: pricingDetails.dayType,
    status: 'pending', // Will be confirmed only after successful payment
    paymentStatus: 'unpaid',
    // expiresAt will be set automatically by the model
  } as any

  const newBooking = await createBooking(newBookingData)

  res.status(201).json({
    message: 'Booking created successfully. Please complete payment within 15 minutes to confirm your booking.',
    booking: newBooking,
    pricing: {
      pricePerSlot: pricingDetails.pricePerSlot,
      duration: pricingDetails.durationInHours,
      totalPrice: pricingDetails.totalPrice,
      appliedRule: pricingDetails.appliedRule,
    },
    nextStep: 'Complete payment to confirm your booking',
  })
})

// Get my booking handler
export const getMyBookingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bookings = await findBookingByUser(req.user?.id as any)

  res.json({
    message: 'Your bookings retrieved successfully.',
    count: bookings.length,
    data: bookings,
  })
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

  // Authorization check
  const isOwner = booking.user.equals(req.user!.id)
  const isAdmin = turf.admins.some(adminId => adminId.equals(req.user!.id))
  const isManager = req.user!.role === 'manager'

  if (!isOwner && !isAdmin && !isManager) {
    throw new AppError('Forbidden: You do not have permission to view this booking', 403)
  }

  res.json({
    message: 'Booking details retrieved successfully.',
    data: booking,
  })
})

// Get turf availability handler - FIXED
export const getTurfAvailabilityHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date } = req.query
  const { id: turfId } = req.params

  if (!date || typeof date !== 'string') {
    throw new AppError('Date query parameter is required', 400)
  }

  const availabilityData = await getTurfAvailability(turfId, new Date(date))

  res.status(200).json({
    message: 'Turf availability retrieved successfully.',
    success: true,
    data: availabilityData,
  })
})

// Update booking status handler - FIXED
export const updateBookingStatusHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = updateBookingStatusSchema.parse(req.body)
  const { id: bookingId } = req.params

  const booking = await findBookingById(bookingId)
  if (!booking) {
    throw new AppError('Booking not found', 404)
  }

  // Authorization check: Only a manager or the admin of the specific turf can update the status
  const turf = await Turf.findById(booking.turf)
  const isAdminOfThisTurf = turf && turf.admins.some(adminId => adminId.equals(req.user!.id))

  if (req.user!.role !== 'manager' && !isAdminOfThisTurf) {
    throw new AppError('Forbidden: You are not authorized to perform this action.', 403)
  }

  // FIXED: Business logic validation
  if (status === 'confirmed' && booking.paymentStatus !== 'paid') {
    throw new AppError('Cannot confirm booking without successful payment', 400)
  }

  const updatedBooking = await updateBookingStatus(bookingId, status)

  res.json({
    message: `Booking status updated to ${status} successfully.`,
    data: updatedBooking,
  })
})
