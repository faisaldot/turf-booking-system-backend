import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
  phone: z.string().min(11).max(14).optional(),
  profilePictures: z.url().optional(),
})
