import { z } from 'zod'

export const createBookingSchema = z.object({
  turf: z.string(),
  date: z.string().date().transform(str => new Date(str)),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'),
  // totalPrice is no longer required from the client
})

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']),
})
