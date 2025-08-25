import type { Request, Response } from 'express'
import crypto from 'node:crypto'
import { Otp } from '../models/Otp'
import { User } from '../models/User'
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifyOtpSchema } from '../schemas/authSchema'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { sendEmail } from '../utils/sendEmil'

// POST /api/v1/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = registerSchema.parse(req.body)

  const existingUser = await User.findOne({ email })

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new AppError('This email is already registered and verified.', 409)
    }
    else {
      // User exists but is not verified, so we RESEND the OTP
      console.log('Unverified user exists. Resending OTP.')

      const otpCode = crypto.randomInt(100000, 999999).toString()

      // Update existing OTP or create a new one
      await Otp.findOneAndUpdate(
        { email },
        { otp: otpCode, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )

      await sendEmail({
        to: email,
        subject: 'Your New Verification Code',
        html: `
          <h1>Here is your new OTP</h1>
          <p>Your new One-Time Password (OTP) is:</p>
          <h2>${otpCode}</h2>
          <p>This code will expire in 10 minutes.</p>
        `,
      })

      return res.status(200).json({
        message: 'An unverified account already exists. A new OTP has been sent to your email.',
      })
    }
  }

  // This part now only runs for brand new users
  await User.create({ name, email, password, phone, isVerified: false })

  // Generate OTP
  const otpCode = crypto.randomInt(100000, 999999).toString()

  // Save the OTP to the database
  await Otp.create({ email, otp: otpCode, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }) // 10 minute expiry

  // Save OTP email
  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Welcome to Khelbi naki!</h1>
      <p>Your One-Time Password (OTP) for email verification is:</p>
      <h2>${otpCode}</h2>
      <p>This code will expire in 10 minutes.</p>
    `,
  })

  res.status(201).json({
    message: 'Registration successful. Please check your email for an OTP to verify your account.',
  })
})

// POST /api/v1/auth/verify-otp
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = verifyOtpSchema.parse(req.body)

  const user = await User.findOne({ email })
  if (!user) {
    throw new AppError('User not found', 404)
  }
  if (user.isVerified) {
    throw new AppError('This account is already verified', 400)
  }

  const otpEntry = await Otp.findOne({ email, otp })

  if (!otpEntry) {
    throw new AppError('Invalid or expired OTP', 400)
  }

  // OTP is correct, so verify the user
  user.isVerified = true
  await user.save()

  // Clean up the used OTP
  await Otp.deleteOne({ _id: otpEntry._id })

  // Now, log the user in by issuing tokens
  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  res.status(200).json({
    message: 'Email verified successfully. You are now logged in.',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  })
})

// POST /api/v1/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)

  const user = await User.findOne({ email })
  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  if (!user.isVerified) {
    throw new AppError('Your account has not verified. Please check your email for the OTP', 403)
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact the support.', 403)
  }

  const ok = await user.comparePassword(password)
  if (!ok) {
    throw new AppError('Invalid email or password', 401)
  }

  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  res.json({
    message: 'Login successful',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  })
})

// POST /api/v1/auth/refresh-token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string }
  if (!refreshToken) {
    throw new AppError('Refresh token required', 400)
  }

  const payload = verifyRefreshToken(refreshToken) as any

  const user = await User.findById(payload.id)
  if (!user) {
    throw new AppError('User not found', 401)
  }

  const newAccessToken = signAccessToken({ id: user._id, role: user.role })
  res.json({ accessToken: newAccessToken })
})

// POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body)

  const user = await User.findOne({ email })
  if (!user) {
    return res.json({ message: 'If the email is in our system, a password reset link has been sent.' })
  }

  // Generate the reset token
  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  /*
      In a real app, we would send the token via email.
      For development, we'll send it in the response.
      IMPORTANT: Do NOT do this in production.
  */
  console.log(`Password reset token: ${resetToken}`)

  res.json({
    message: 'Password reset token generated.',
    // In production, we would not send the token back in the response
    _dev_reset_token: refreshToken,
  })
})

// PATCH /api/v1/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = resetPasswordSchema.parse(req.body)

  // Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })

  // If token has not expired, and there is a user, set the new password
  if (!user) {
    throw new AppError('Token is invalid or has expired', 400)
  }

  user.password = password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  // Log the user in, send JWT
  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  res.json({
    message: 'Password reset successfully.',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  })
})

// POST api/v1/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // For a stateless JWT-based system, logout is primarily handled on the client-side.
  // The client should discard the JWT (e.g., remove it from localStorage or cookies).
  res.status(200).json({ message: 'Logout successfully' })
})
