/* import type { Request, Response } from 'express'
import crypto from 'node:crypto'
import { env } from '../config/env'
import { Otp } from '../models/Otp'
import { User } from '../models/User'
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifyOtpSchema } from '../schemas/authSchema'
import { sendTemplatedEmail } from '../services/emailServices'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { checkOtpRateLimit, recordFailedAttempt, resetAttempt } from '../utils/otpRateLimit'
import { sendEmail } from '../utils/sendEmail'
import { addToBlocklist } from '../utils/tokenBlockList'

// Helper: set refresh token cookie
function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh-token',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

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

  checkOtpRateLimit(email)

  const user = await User.findOne({ email })
  if (!user) {
    recordFailedAttempt(email)
    throw new AppError('User not found', 404)
  }
  if (user.isVerified) {
    throw new AppError('This account is already verified', 400)
  }

  const otpEntry = await Otp.findOne({ email, otp })

  if (!otpEntry) {
    recordFailedAttempt(email)

    throw new AppError('Invalid or expired OTP', 400)
  }

  // OTP is correct, so verify the user
  user.isVerified = true
  await user.save()

  resetAttempt(email)
  // Clean up the used OTP
  await Otp.deleteOne({ _id: otpEntry._id })

  // Now, log the user in by issuing tokens
  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh-token',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
  res.status(200).json({ accessToken })

  // res.status(200).json({
  //   message: 'Email verified successfully. You are now logged in.',
  //   user: { id: user._id, name: user.name, email: user.email, role: user.role },
  //   accessToken,
  //   refreshToken,
  // })
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

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh-token',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
  res.status(200).json({ accessToken })

  // res.json({
  //   message: 'Login successful',
  //   user: { id: user._id, name: user.name, email: user.email, role: user.role },
  //   accessToken,
  //   refreshToken,
  // })
})

// POST /api/v1/auth/refresh-token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken as string | undefined

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400)
  }

  const payload = verifyRefreshToken(refreshToken) as any

  const accessToken = signAccessToken({ id: payload.id, role: payload.role })
  const newRefreshToken = signRefreshToken({ id: payload.id, role: payload.role })

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true, // not accessible via JS
    secure: process.env.NODE_ENV === 'production', // only https in prod
    sameSite: 'strict',
    path: '/api/v1/auth/refresh-token',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })

  res.json({ accessToken })
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

  const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`

  await sendTemplatedEmail({
    to: user.email,
    subject: 'Password Reset Request',
    title: 'Password Reset Request',
    body: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
          <p>Please click on the following link, or paste this into your browser to complete the process:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
  })

  res.json({
    message: 'Password reset token generated.',
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

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh-token',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
  res.status(200).json({ accessToken })

  // res.json({
  //   message: 'Password reset successfully.',
  //   user: { id: user._id, name: user.name, email: user.email, role: user.role },
  //   accessToken,
  //   refreshToken,
  // })
})

// POST api/v1/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  const accessToken = authHeader?.split(' ')[1]

  if (accessToken) {
    addToBlocklist(accessToken)
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh-token' })
  res.status(200).json({ message: 'Logout successfully' })
})
 */

// src/controllers/authController.ts
/* import type { Request, Response } from 'express'
import crypto from 'node:crypto'
import { Otp } from '../models/Otp'
import { RefreshToken } from '../models/RefreshToken'
import { User } from '../models/User'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from '../schemas/authSchema'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { sendEmail } from '../utils/sendEmail'

// Helper: set refresh token cookie
function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh-token',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

// POST /api/v1/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = registerSchema.parse(req.body)

  const existingUser = await User.findOne({ email })

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new AppError('This email is already registered and verified.', 409)
    }

    // If user exists but not verified, update fields optionally
    existingUser.name = name ?? existingUser.name
    existingUser.phone = phone ?? existingUser.phone
    if (password)
      existingUser.password = password
    await existingUser.save()
    // create OTP below (reuse existing user)
  }

  const user = existingUser ?? (await User.create({ name, email, password, phone }))

  // Create OTP (6-digit) and save in Otp collection
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
  await Otp.create({
    email: user.email,
    otp: otpCode, // <-- correct field name
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  })

  // Send OTP via email (best-effort; don't fail registration if email sending fails)
  try {
    await sendEmail({
      to: user.email,
      subject: 'Your verification code',
      html: `Your verification code is ${otpCode}. It will expire in 10 minutes.`,
    })
  }
  catch {
    // swallow
  }

  res.status(201).json({
    message: 'User created (or updated). A verification OTP was sent to the email.',
    email: user.email,
  })
})

// POST /api/v1/auth/verify-otp
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = verifyOtpSchema.parse(req.body)

  const otpEntry = await Otp.findOne({ email, otp })
  if (!otpEntry)
    throw new AppError('Invalid or expired OTP', 400)
  if (otpEntry.expiresAt && otpEntry.expiresAt.getTime() < Date.now()) {
    await Otp.deleteOne({ _id: otpEntry._id })
    throw new AppError('OTP expired', 400)
  }

  const user = await User.findOne({ email })
  if (!user)
    throw new AppError('User not found', 404)

  user.isVerified = true
  await user.save()
  await Otp.deleteOne({ _id: otpEntry._id }) // keep this line as your original; or use otpEntry._id

  // Issue tokens (rest unchanged)...
  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  setRefreshCookie(res, refreshToken)

  res.status(200).json({
    message: 'Email verified successfully. You are now logged in.',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  })
})

// POST /api/v1/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password', 401)
  }
  if (!user.isVerified) {
    throw new AppError('Email not verified', 403)
  }

  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  setRefreshCookie(res, refreshToken)

  res.status(200).json({
    message: 'Login successful',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  })
})

// POST /api/v1/auth/refresh-token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const cookieToken = req.cookies?.refreshToken as string | undefined
  if (!cookieToken) {
    throw new AppError('Refresh token required', 400)
  }

  const payload = verifyRefreshToken(cookieToken) as any

  // Check DB for the exact token
  const stored = await RefreshToken.findOne({ token: cookieToken })
  if (!stored) {
    // Not found — possibly reused or already rotated/revoked
    throw new AppError('Invalid refresh token', 401)
  }

  // Remove used token (rotation)
  await stored.deleteOne()

  // Generate and persist new refresh token
  const newRefreshToken = signRefreshToken({ id: payload.id, role: payload.role })
  await RefreshToken.create({
    user: payload.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  // Issue new access token
  const accessToken = signAccessToken({ id: payload.id, role: payload.role })

  // Set rotated cookie
  setRefreshCookie(res, newRefreshToken)

  res.json({ accessToken })
})

// POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body)
  const user = await User.findOne({ email })
  if (!user) {
    // Don't leak existence
    return res.json({ message: 'If the email is in our system, a password reset link has been sent.' })
  }

  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      html: `Your password reset token: ${resetToken}`,
    })
  }
  catch {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
    throw new AppError('There was an error sending the email. Try again later.', 500)
  }

  res.json({ message: 'If the email is in our system, a password reset link has been sent.' })
})

// PATCH /api/v1/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = resetPasswordSchema.parse(req.body)
  const token = req.params.token

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })
  if (!user)
    throw new AppError('Token is invalid or has expired', 400)

  user.password = password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  // Issue tokens after password reset
  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  setRefreshCookie(res, refreshToken)

  res.json({
    message: 'Password reset successfully.',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  })
})

// POST /api/v1/auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.cookies?.refreshToken) {
    try {
      await RefreshToken.deleteOne({ token: req.cookies.refreshToken })
    }
    catch {
      // ignore errors deleting token
    }
  }
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh-token' })
  res.status(200).json({ message: 'Logout successfully' })
})
 */

import type { Request, Response } from 'express'
import crypto from 'node:crypto'
import { env } from '../config/env'
import { Otp } from '../models/Otp'
import { RefreshToken } from '../models/RefreshToken'
import { User } from '../models/User'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from '../schemas/authSchema'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { sendEmail } from '../utils/sendEmail'

// Helper: set refresh token cookie
function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh-token',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

// -------------------- REGISTER --------------------
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = registerSchema.parse(req.body)

  let user = await User.findOne({ email })

  if (user) {
    if (user.isVerified) {
      throw new AppError('This email is already registered and verified.', 409)
    }
    // Update unverified user's info if provided
    user.name = name ?? user.name
    user.phone = phone ?? user.phone
    if (password)
      user.password = password
    await user.save()
  }
  else {
    user = await User.create({ name, email, password, phone })
  }

  // Generate OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
  await Otp.findOneAndUpdate(
    { email },
    { otp: otpCode, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )

  // Send OTP via email (best-effort)
  try {
    await sendEmail({
      to: email,
      subject: 'Your verification code',
      html: `<p>Your OTP is <strong>${otpCode}</strong> and will expire in 10 minutes.</p>`,
    })
  }
  catch {
    // Ignore email failures for now
  }

  res.status(201).json({
    message: 'User created/updated. OTP sent to email for verification.',
    email: user.email,
  })
})

// -------------------- VERIFY OTP --------------------
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = verifyOtpSchema.parse(req.body)

  const otpEntry = await Otp.findOne({ email, otp })
  if (!otpEntry)
    throw new AppError('Invalid OTP', 400)
  if (otpEntry.expiresAt.getTime() < Date.now()) {
    await Otp.deleteOne({ _id: otpEntry._id })
    throw new AppError('OTP expired', 400)
  }

  const user = await User.findOne({ email })
  if (!user)
    throw new AppError('User not found', 404)

  user.isVerified = true
  await user.save()
  await Otp.deleteOne({ _id: otpEntry._id })

  // Issue tokens
  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  setRefreshCookie(res, refreshToken)

  res.status(200).json({
    message: 'Email verified successfully. You are now logged in.',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  })
})

// -------------------- LOGIN --------------------
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body)

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password)))
    throw new AppError('Incorrect email or password', 401)
  if (!user.isVerified)
    throw new AppError('Email not verified', 403)

  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  setRefreshCookie(res, refreshToken)

  res.status(200).json({
    message: 'Login successful',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  })
})

// -------------------- REFRESH TOKEN --------------------
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const cookieToken = req.cookies?.refreshToken
  if (!cookieToken)
    throw new AppError('Refresh token required', 400)

  const payload = verifyRefreshToken(cookieToken) as any
  const storedToken = await RefreshToken.findOne({ token: cookieToken })
  if (!storedToken)
    throw new AppError('Invalid refresh token', 401)

  // Rotate token
  await storedToken.deleteOne()
  const newRefreshToken = signRefreshToken({ id: payload.id, role: payload.role })
  await RefreshToken.create({
    user: payload.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  setRefreshCookie(res, newRefreshToken)
  const accessToken = signAccessToken({ id: payload.id, role: payload.role })

  res.json({ accessToken })
})

// -------------------- FORGOT PASSWORD --------------------
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body)
  const user = await User.findOne({ email })
  if (!user)
    return res.json({ message: 'If the email is in our system, a password reset link has been sent.' })

  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      html: `Click to reset: <a href="${env.CLIENT_URL}/reset-password/${resetToken}">Reset Password</a>`,
    })
  }
  catch {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
    throw new AppError('Error sending email', 500)
  }

  res.json({ message: 'If the email is in our system, a password reset link has been sent.' })
})

// -------------------- RESET PASSWORD --------------------
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = resetPasswordSchema.parse(req.body)
  const token = req.params.token

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })
  if (!user)
    throw new AppError('Token is invalid or expired', 400)

  user.password = password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  const accessToken = signAccessToken({ id: user._id, role: user.role })
  const refreshToken = signRefreshToken({ id: user._id, role: user.role })

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  setRefreshCookie(res, refreshToken)

  res.json({
    message: 'Password reset successfully.',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  })
})

// -------------------- LOGOUT --------------------
export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.cookies?.refreshToken) {
    try {
      await RefreshToken.deleteOne({ token: req.cookies.refreshToken })
    }
    catch {}
  }
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh-token' })
  res.status(200).json({ message: 'Logout successfully' })
})
