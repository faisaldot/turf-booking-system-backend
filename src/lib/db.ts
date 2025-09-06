import mongoose from 'mongoose'
import { env } from '../config/env'

async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      // Add connection options
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      heartbeatFrequencyMS: 2000, // Check connection every 2s
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain minimum 2 connections
      retryWrites: true,
    })
    console.log('✅ MongoDB connected')
  }
  catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    process.exit(1)
  }
}

export default connectDB
