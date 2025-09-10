// Optional service to clean up expired data

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
