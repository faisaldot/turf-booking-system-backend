import type { IBooking } from '../models/Booking'
import { Booking } from '../models/Booking'

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
  return await Booking.find({ user: userId }).populate('user', 'name email').populate('turf')
}

// Turf Availability service
export async function getTurfAvailability(turfId: string, date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const bookings = await Booking.find({
    turf: turfId,
    date: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
    status: { $ne: 'cancelled' },
  })
  return bookings
}
