import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
  phone: z.string().min(11).max(14).optional(),
  profilePictures: z.url().optional(),
})

export const createAdminSchema = z.object({
  name: z.string().min(2),
  email: z.email().lowercase(),
  password: z.string().min(6),
  phone: z.string().min(11).max(14).optional(),
})

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
})
