import { email, z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email().lowercase(),
  password: z.string().min(6),
  phone: z.string().min(11).max(14).optional(),
})

export const loginSchema = z.object({
  name: z.string().min(2),
  email: z.email().lowercase(),
  password: z.string().min(6),
})
