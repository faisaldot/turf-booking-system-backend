import { env } from '../config/env'
import { User } from '../models/User'

/**
 * Checks if a super admin (manager) exists in the database.
 * If not, it creates one using credentials from environment variables.
 * This function is designed to be run on application startup.
 */
export async function seedSuperAdmin() {
  try {
    // Check if essential environment variables are set
    const { MANAGER_EMAIL, MANAGER_PASSWORD, MANAGER_NAME } = env
    if (!MANAGER_EMAIL || !MANAGER_PASSWORD || !MANAGER_NAME) {
      console.warn('⚠️  Manager account credentials not found in .env. Skipping super admin seeding.')
      return
    }

    // Check if a manager account already exists
    const existingManager = await User.findOne({ role: 'manager' })
    if (existingManager) {
      console.log('✅ Manager account already exists.')
      return
    }

    // If no manager exists, create one
    await User.create({
      name: MANAGER_NAME,
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD,
      role: 'manager',
      isVerified: true, // Super admins are verified by default
      isActive: true,
    })

    console.log('✅ Super admin account created successfully!')
  }
  catch (error) {
    console.error('❌ Error during super admin seeding:', error)
  }
}
