import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { env } from '../config/env'
import { Otp } from '../models/Otp'
import { User } from '../models/User'

// We should use separate database for testing
const MONGODB_URI_TEST = `${env.MONGODB_URI}-test`

beforeAll(async () => {
  // Connect to the test database before any tests run
  await mongoose.connect(MONGODB_URI_TEST)
})

afterEach(async () => {
  // Clean up the database after each test
  await User.deleteMany({})
  await Otp.deleteMany({})
})

afterAll(async () => {
  // Disconnect from the database after all tests are done
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
})
