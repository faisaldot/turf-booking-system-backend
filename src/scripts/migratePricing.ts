import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Turf } from '../models/Turf' // Adjust path if needed

dotenv.config({ path: '.env' }) // Adjust path to your .env file

/**
 * This script migrates turf documents from an old pricing model
 * (e.g., pricePerSlot) to the new flexible pricingRules structure.
 *
 * How to run:
 * 1. Make sure your .env file is correctly configured.
 * 2. Back up your database before running this script.
 * 3. Run from your terminal: ts-node src/scripts/migratePricing.ts
 */
async function migrateTurfPricing() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file. Exiting.')
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ MongoDB connected for migration.')

    // Find turfs that have the old `pricePerSlot` field but NOT the new `pricingRules`
    // We cast to `any` to access the potentially non-existent old field.
    const turfsToMigrate = await Turf.find({
      pricingRules: { $exists: false, $eq: [] },
      pricePerSlot: { $exists: true },
    }) as any

    if (turfsToMigrate.length === 0) {
      console.log('✅ No turfs found that need migration.')
      return
    }

    console.log(`Found ${turfsToMigrate.length} turfs to migrate...`)
    let migratedCount = 0

    for (const turf of turfsToMigrate) {
      const oldPrice = (turf as any).pricePerSlot

      // Create a simple, default 'all-days' pricing rule based on the old price
      turf.pricingRules = [
        {
          dayType: 'all-days',
          timeSlots: [
            {
              startTime: turf.operatingHours.start,
              endTime: turf.operatingHours.end,
              pricePerSlot: oldPrice,
            },
          ],
        },
      ]

      turf.defaultPricePerSlot = oldPrice;

      // Unset the old field to clean up the document
      (turf as any).pricePerSlot = undefined

      await turf.save({ validateBeforeSave: false }) // Skip validation to save with unset field
      migratedCount++
      console.log(`Migrated turf: ${turf.name}`)
    }

    console.log(`✅ Successfully migrated ${migratedCount} turfs.`)
  }
  catch (error) {
    console.error('❌ An error occurred during migration:', error)
  }
  finally {
    await mongoose.disconnect()
    console.log('🔌 MongoDB disconnected.')
  }
}

// Execute the migration
migrateTurfPricing()
