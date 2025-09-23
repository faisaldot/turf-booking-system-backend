// Optional service to clean up expired data

import { Booking } from '../models/Booking'
import { Otp } from '../models/Otp'
import { RefreshToken } from '../models/RefreshToken'

/**
 * Clean up expired OTP entries and refresh tokens
 * Should be run periodically (e.g., via cron job or scheduled task)
 */
export async function cleanupExpiredData() {
  try {
    // Clean up expired OTPs
    const expiredOtps = await Otp.deleteMany({
      expiresAt: { $lt: new Date() },
    })

    // Clean up expired refresh tokens
    const expiredTokens = await RefreshToken.deleteMany({
      expiresAt: { $lt: new Date() },
    })

    console.log(`🧹 Cleanup completed: ${expiredOtps.deletedCount} expired OTPs, ${expiredTokens.deletedCount} expired refresh tokens`)

    return {
      otpsDeleted: expiredOtps.deletedCount,
      tokensDeleted: expiredTokens.deletedCount,
    }
  }
  catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
}

/**
 * Start periodic cleanup (call this in your main app startup)
 */
export function startPeriodicCleanup() {
  // Run cleanup every hour
  setInterval(async () => {
    await cleanupExpiredData()
  }, 60 * 60 * 1000) // 1 hour

  console.log('✅ Periodic cleanup scheduled every hour')
}

/*  Cleanup Service for Expired Bookings */
export async function cleanupExpiredBookings() {
  try {
    const expiredBookings = await Booking.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      {
        status: 'expired',
      },
    )

    console.log(`🧹 Marked ${expiredBookings.modifiedCount} bookings as expired`)
    return expiredBookings.modifiedCount
  }
  catch (error) {
    console.error('❌ Error during booking cleanup:', error)
    throw error
  }
}
