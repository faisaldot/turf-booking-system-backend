import { z } from 'zod'

export const operatingHoursSchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
})

export const createTurfSchema = z.object({
  name: z.string().min(3),
  location: z.string().min(3),
  description: z.string().optional(),
  pricePerSlot: z.number().nonnegative(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.url()).optional(),
  operatingHours: operatingHoursSchema,
})

export const updatedTurfSchema = createTurfSchema.partial()
