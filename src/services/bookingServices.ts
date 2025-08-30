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
  return await Booking.find({ user: userId }).populate('turf', 'name location')
}

// Find booking service by id
export async function findBookingById(userId: string) {
  return await Booking.findById(userId).populate('user', 'name email').populate('turf')
}

// Turf Availability service
export async function getTurfAvailability(turfId: string, date: Date) {
  // Fetch the turf to get operating hours and pricing rules
  const turf = await Turf.findById(turfId)
  if (!turf) {
    throw new AppError('Turf not found', 404)
  }

  // Get all existing bookings for that day to check against
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const existingBookings = await Booking.find({
    turf: turfId,
    date: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
    status: { $ne: 'cancelled' },
  }).select('startTime')

  const bookedSlots = new Set(existingBookings.map(b => b.startTime))

  // Generate all possible 1-hour slots based on operating hours
  const availableSlots = []
  const { start: operatingStart, end: operatingEnd } = turf.operatingHours

  let currentTime = new Date(`${date.toISOString().split('T')[0]}T${operatingStart}:00`)
  const endTime = new Date(`${date.toISOString().split('T')[0]}T${operatingEnd}:00`)

  while (currentTime < endTime) {
    const startTimeString = currentTime.toISOString().substring(0, 5) // "HH:mm"

    const nextHour = new Date(currentTime)
    nextHour.setHours(nextHour.getHours() + 1)

    const endTimeString = nextHour.toTimeString().substring(0, 5)

    // For each slot, calculate price and check availability
    const pricing = calculateBookingPrice(turf, date, startTimeString, endTimeString)

    availableSlots.push({
      startTime: startTimeString,
      endTime: endTimeString,
      isAvailable: !bookedSlots.has(startTimeString),
      pricePerSlot: pricing.pricePerSlot,
      dayTypeLabel: pricing.dayType === 'friday-saturday' ? 'FRI-SAT' : 'SUN-THUS',
    })
    currentTime = nextHour
  }

  const dayType = calculateBookingPrice(turf, date, '00:00', '01:))').dayType
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
