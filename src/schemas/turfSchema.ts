import { z } from 'zod'

export const operatingHoursSchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
})

const timeSlotSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'),
  pricePerSlot: z.number().nonnegative(),
})

const pricingRuleSchema = z.object({
  dayType: z.enum(['sunday-thursday', 'friday-saturday', 'all-days']),
  timeSlots: z.array(timeSlotSchema).min(1, 'At least one time slot is required per rule.'),
})

export const createTurfSchema = z.object({
  name: z.string().min(3),
  location: z.object({
    address: z.string().min(3),
    city: z.string().min(3),
  }),
  description: z.string().optional(),

  pricingRule: z.array(pricingRuleSchema).min(1, 'At least one pricing rule is required.'),
  defaultPricePerSlot: z.number().nonnegative('Default price mus be a non-negative number.'),

  amenities: z.array(z.string()).optional(),
  images: z.array(z.url()).optional(),
  operatingHours: operatingHoursSchema,
})

export const updatedTurfSchema = createTurfSchema.partial()
