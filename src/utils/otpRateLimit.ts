import AppError from './AppError'

interface OtpAttempt {
  count: number
  lockoutUntil: number
}

// An in-memory store to track OTP verification attempts.
// In a production environment with multiple instances, this should be replace with redis

const otpAttempts = new Map<string, OtpAttempt>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// Checks if an email is currently locked out due to too many failed OTP attempts
export function checkOtpRateLimit(email: string) {
  const attempt = otpAttempts.get(email)

  if (attempt && attempt.lockoutUntil - Date.now()) {
    const remainingSeconds = Math.ceil((attempt.lockoutUntil - Date.now()) / 1000)
    throw new AppError(`Too many failed OTP attempts. Please try again in ${remainingSeconds} seconds`, 409)
  }
}

// Record a failed OTP attempt for a given email.
export function recordFailedAttempt(email: string) {
  const attempt = otpAttempts.get(email) || { count: 0, lockoutUntil: 0 }
  attempt.count++

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS
    attempt.count = 0 // Resetting the counter for the next window
  }
  otpAttempts.set(email, attempt)
}

// Reset the OTP attempt count for a given email
export function resetAttempt(email: string) {
  otpAttempts.delete(email)
}
