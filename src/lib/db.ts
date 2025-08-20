import mongoose from 'mongoose'
import { env } from '../config/env'

async function connectDB() {
  await mongoose.connect(env.MONGODB_URI)
  console.log('✅ MongoDB connected')
}

export default connectDB
