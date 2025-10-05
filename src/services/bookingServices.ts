import type { IBooking } from '../models/Booking'
import { Booking } from '../models/Booking'
import { Turf } from '../models/Turf'
import AppError from '../utils/AppError'
import { calculateBookingPrice } from './turfPricingService'

// Creating booking service
export async function createBooking(data: Partial<IBooking>) {
  const newBooking = await Booking.create(data)
  return newBooking
}

// Find booking service
export async function findBookingByUser(userId: string) {
  return await Booking.find({ user: userId })
    .populate('turf', 'name location images')
    .select('-__v')
    .sort({ createdAt: -1 })
    .lean()
}

// Find booking service by id
export async function findBookingById(bookingId: string) {
  console.log(bookingId)
  return await Booking.findById(bookingId).populate('user', 'name email').populate('turf')
}

// Turf Availability service
export async function getTurfAvailability(turfId: string, date: Date) {
  const turf = await Turf.findById(turfId)
  if (!turf) {
    throw new AppError('Turf not found', 404)
  }

  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  //  Get all bookings that make slots unavailable
  const unavailableBookings = await Booking.find({
    turf: turfId,
    date: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
    // A slot is unavailable if:
    // 1. Booking is confirmed (paid or unpaid)
    // 2. Booking is pending and created within last 15 minutes (temporary hold)
    $or: [
      { status: 'confirmed' }, // Always unavailable regardless of payment
      {
        status: 'pending',
        createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    ],
  }).select('startTime status paymentStatus')

  // Create set of unavailable slots
  const unavailableSlots = new Set(unavailableBookings.map(b => b.startTime))

  // Generate all possible 1-hour slots based on operating hours
  const availableSlots = []
  const { start: operatingStart, end: operatingEnd } = turf.operatingHours

  let currentTime = new Date(`${date.toISOString().split('T')[0]}T${operatingStart}:00`)
  const endTime = new Date(`${date.toISOString().split('T')[0]}T${operatingEnd}:00`)

  while (currentTime < endTime) {
    const startTimeString = currentTime.toTimeString().substring(0, 5) // "HH:mm"

    const nextHour = new Date(currentTime)
    nextHour.setHours(nextHour.getHours() + 1)

    const endTimeString = nextHour.toTimeString().substring(0, 5)

    // Calculate price for each slot
    const pricing = calculateBookingPrice(turf, date, startTimeString, endTimeString)

    availableSlots.push({
      startTime: startTimeString,
      endTime: endTimeString,
      isAvailable: !unavailableSlots.has(startTimeString), // FIXED: Use unavailableSlots set
      pricePerSlot: pricing.pricePerSlot,
      dayTypeLabel: pricing.dayType === 'friday-saturday' ? 'FRI-SAT' : 'SUN-THU',
    })
    currentTime = nextHour
  }

  const dayType = calculateBookingPrice(turf, date, '00:00', '01:00').dayType
  return {
    date: date.toISOString().split('T')[0],
    dayType,
    slots: availableSlots,
  }
}

// Update booking status service
export async function updateBookingStatus(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled') {
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { status },
    { new: true, runValidators: true },
  )
  return updatedBooking
}
