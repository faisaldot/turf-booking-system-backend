import { z } from 'zod'

// Register schema
export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email().lowercase(),
  password: z.string().min(6),
  phone: z.string().min(11).max(14).optional(),
})

// Login schema
export const loginSchema = z.object({
  email: z.email().lowercase(),
  password: z.string().min(6),
})

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.email().lowercase(),
})

// Reset password schema
export const resetPasswordSchema = z.object({
  password: z.string().min(6),
})

// OTP verification schema
export const verifyOtpSchema = z.object({
  email: z.email().lowercase(),
  otp: z.string().length(6),
})
