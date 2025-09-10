import { z } from 'zod'

export const createBookingSchema = z.object({
  turf: z.string().trim(),
  date: z.string().date().transform(str => new Date(str)),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'),
}).refine((data) => {
  // Ensure end time is after start time
  const start = new Date(`1970-01-01T${data.startTime}:00`)
  const end = new Date(`1970-01-01T${data.endTime}:00`)
  return end > start
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine((data) => {
  // Ensure booking date is not in the past
  const bookingDate = new Date(data.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return bookingDate >= today
}, {
  message: 'Booking date cannot be in the past',
  path: ['date'],
})

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']),
})
