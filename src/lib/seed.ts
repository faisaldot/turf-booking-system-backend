import { env } from '../config/env'
import { Turf } from '../models/Turf'
import { User } from '../models/User'

/**
 * Checks if a super admin (manager) exists and creates one if not.
 */
export async function seedSuperAdmin() {
  try {
    const { MANAGER_EMAIL, MANAGER_PASSWORD, MANAGER_NAME } = env
    if (!MANAGER_EMAIL || !MANAGER_PASSWORD || !MANAGER_NAME) {
      console.warn('⚠️  Manager account credentials not found in .env. Skipping super admin seeding.')
      return
    }

    const existingManager = await User.findOne({ role: 'manager' })
    if (existingManager) {
      console.log('✅ Manager account already exists.')
      return
    }

    await User.create({
      name: MANAGER_NAME,
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD,
      role: 'manager',
      isVerified: true,
      isActive: true,
    })

    console.log('✅ Super admin account created successfully!')
  }
  catch (error) {
    console.error('❌ Error during super admin seeding:', error)
  }
}

/**
 * Seeds initial turf data if no turfs exist in the database.
 */
export async function seedInitialTurfs() {
  try {
    const turfCount = await Turf.countDocuments()
    if (turfCount > 0) {
      console.log('✅ Turf data already exists.')
      return
    }

    const manager = await User.findOne({ role: 'manager' })
    if (!manager) {
      console.warn('⚠️  Manager account not found. Cannot seed turfs without an admin.')
      return
    }

    const sampleTurfData = {
      name: 'ChattoTurf Bashundhara',
      location: {
        address: 'Bashundhara Residential Area',
        city: 'Dhaka',
      },
      description: 'A premium 7-a-side turf with state-of-the-art facilities.',
      operatingHours: {
        start: '06:00',
        end: '23:00',
      },
      defaultPricePerSlot: 2000,
      pricingRules: [
        {
          dayType: 'sunday-thursday',
          timeSlots: [
            { startTime: '06:00', endTime: '17:00', pricePerSlot: 2000 },
            { startTime: '17:00', endTime: '23:00', pricePerSlot: 3500 },
          ],
        },
        {
          dayType: 'friday-saturday',
          timeSlots: [
            { startTime: '06:00', endTime: '17:00', pricePerSlot: 2500 },
            { startTime: '17:00', endTime: '23:00', pricePerSlot: 3500 },
          ],
        },
      ],
      amenities: ['Floodlights', 'Parking', 'Changing Room', 'Gallery'],
      admins: [manager._id],
    }

    const turfsToCreate = []
    for (let i = 1; i <= 20; i++) {
      turfsToCreate.push({
        ...sampleTurfData,
        name: `ChattoTurf ${i}`,
        location: {
          address: `Bashundhara Residential Area, Block ${String.fromCharCode(64 + Math.ceil(i / 5))}`,
          city: `City ${Math.ceil(i / 10)}`,
        },
        description: `This is a sample turf number ${i}. It offers modern facilities and a great playing experience.`,
      })
    }

    await Turf.insertMany(turfsToCreate)
    console.log('✅ Initial turf data seeded successfully!')
  }
  catch (error) {
    console.error('❌ Error during turf seeding:', error)
  }
}
