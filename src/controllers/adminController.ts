import type { Response } from 'express'
import type { Types } from 'mongoose'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { Booking } from '../models/Booking'
import { Turf } from '../models/Turf'
import { User } from '../models/User'
import { createBookingSchema } from '../schemas/bookingSchema'
import { createAdminSchema, updateUserSchema, updateUserStatusSchema } from '../schemas/userSchema'
import { createBooking, findBookingById, updateBookingStatus } from '../services/bookingServices'
import { getAdminDashboardStats, getManagerDashboardStats } from '../services/dashboardService'
import { calculateBookingPrice } from '../services/turfPricingService'
import { findTurfById, updateTurf } from '../services/turfServices'
import { uploadToCloudinary } from '../services/uploadService'
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

// PATCH /api/v1/admin/turfs/:id/image
export const uploadTurfImageHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: turfId } = req.params

  if (!req.file) {
    throw new AppError('No image file provided', 400)
  }

  const turf = await findTurfById(turfId)
  if (!turf) {
    throw new AppError('Turf not found.', 404)
  }

  // Authorization check
  const isAdminForThisTurf = turf.admins.some(adminId => adminId.equals(req.user!.id))
  if (req.user?.role !== 'manager' && !isAdminForThisTurf) {
    throw new AppError('Forbidden: you do not manage this turf.', 403)
  }

  // Upload the file to Cloudinary in a 'turfs' folder
  const imageUrl = await uploadToCloudinary(req.file, 'turfs')

  // Add the new image URL to the turf's images array
  const updatedTurf = await updateTurf(turfId, { $push: { images: imageUrl } })

  res.status(200).json({
    message: 'Image uploaded and turf updated successfully.',
    data: updatedTurf,
  })
})

// ----
export const getAdminBookingsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  let turfIds: string[]

  if (req.user!.role === 'manager') {
    // Manager can see all bookings
    const allTurfs = await Turf.find({ isActive: true })
      .select('_id')
      .lean<{ _id: Types.ObjectId }[]>()

    turfIds = allTurfs.map(turf => turf._id.toString())
  }
  else {
    // Admin can only see their turf bookings
    const adminTurfs = await Turf.find({ admins: req.user!.id }).select('_id').lean<{ _id: Types.ObjectId }[]>()
    turfIds = adminTurfs.map(turf => turf._id.toString())
  }

  const result = await paginate(
    Booking,
    req,
    { turf: { $in: turfIds } },
  )

  // Populate the results
  const populatedData = await Booking.populate(result.data, [
    { path: 'user', select: 'name email phone' },
    { path: 'turf', select: 'name location' },
  ])

  res.status(200).json({
    message: 'Bookings retrieved successfully.',
    data: populatedData,
    meta: result.meta,
  })
})

export const createAdminBookingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedInput = createBookingSchema.parse(req.body)

  const turf = await findTurfById(validatedInput.turf)
  if (!turf) {
    throw new AppError('Turf not found', 404)
  }

  // Check admin permissions for this turf
  const isAdminForThisTurf = turf.admins.some(adminId => adminId.equals(req.user!.id))
  if (req.user!.role !== 'manager' && !isAdminForThisTurf) {
    throw new AppError('Forbidden: you do not manage this turf', 403)
  }

  // For admin bookings, skip payment and mark as confirmed
  const pricingDetails = calculateBookingPrice(turf, validatedInput.date, validatedInput.startTime, validatedInput.endTime)

  const bookingData = {
    ...validatedInput,
    user: validatedInput.user || req.user!.id, // Allow booking for other users
    appliedPricePerSlot: pricingDetails.pricePerSlot,
    totalPrice: pricingDetails.totalPrice,
    pricingRule: pricingDetails.appliedRule,
    dayType: pricingDetails.dayType,
    status: 'confirmed', // Admin bookings are immediately confirmed
    paymentStatus: 'paid', // Assume cash payment or waived
  } as any

  const newBooking = await createBooking(bookingData)

  res.status(201).json({
    message: 'Admin booking created successfully.',
    booking: newBooking,
  })
})

export const cancelBookingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: bookingId } = req.params

  const booking = await findBookingById(bookingId)
  if (!booking) {
    throw new AppError('Booking not found', 404)
  }

  const turf = await Turf.findById(booking.turf)
  const isAdminOfThisTurf = turf && turf.admins.some(adminId => adminId.equals(req.user!.id))

  if (req.user!.role !== 'manager' && !isAdminOfThisTurf) {
    throw new AppError('Forbidden: You are not authorized to perform this action.', 403)
  }

  const updatedBooking = await updateBookingStatus(bookingId, 'cancelled')

  res.json({
    message: 'Booking cancelled successfully.',
    data: updatedBooking,
  })
})

export const deleteBookingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: bookingId } = req.params

  const booking = await findBookingById(bookingId)
  if (!booking) {
    throw new AppError('Booking not found', 404)
  }

  await Booking.findByIdAndDelete(bookingId)

  res.status(200).json({
    message: 'Booking deleted successfully.',
  })
})
