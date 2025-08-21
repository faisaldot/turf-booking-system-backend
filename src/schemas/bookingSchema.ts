import { z } from 'zod'

export const createBookingSchema = z.object({
  turf: z.string(),
  date: z.date().transform(str => new Date(str)),
  startTime: z.string(),
  endTime: z.string(),
  totalPrice: z.number(),
})
