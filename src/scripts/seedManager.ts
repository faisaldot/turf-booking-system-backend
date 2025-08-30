import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { User } from '../models/User'

dotenv.config({ path: '.env' })

/**
 * This script creates a default manager/super-admin user if one doesn't already exist.
 * It's safe to run multiple times.
 *
 * How to run:
 * 1. Set the desired manager credentials in your .env file.
 * MANAGER_EMAIL=manager@example.com
 * MANAGER_PASSWORD=supersecret
 * MANAGER_NAME=Super Admin
 * 2. Run from your terminal: ts-node src/scripts/seedManager.ts
 */
async function seedManager() {
  const { MONGODB_URI, MANAGER_EMAIL, MANAGER_PASSWORD, MANAGER_NAME } = process.env

  if (!MONGODB_URI || !MANAGER_EMAIL || !MANAGER_PASSWORD || !MANAGER_NAME) {
    console.error('❌ Missing required environment variables for seeding manager. Please check your .env file.')
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ MongoDB connected for seeding.')

    // Check if a manager already exists
    const existingManager = await User.findOne({ role: 'manager' })
    if (existingManager) {
      console.log('✅ Manager account already exists. No action needed.')
      return
    }

    // Create the new manager account
    await User.create({
      name: MANAGER_NAME,
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD,
      role: 'manager',
      isVerified: true, // Managers are verified by default
      isActive: true,
    })

    console.log('✅ Successfully created the manager account!')
  }
  catch (error) {
    console.error('❌ An error occurred during seeding:', error)
  }
  finally {
    await mongoose.disconnect()
    console.log('🔌 MongoDB disconnected.')
  }
}

// Execute the seeder
seedManager()
