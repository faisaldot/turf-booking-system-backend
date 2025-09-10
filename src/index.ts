import app from './app'
import { env } from './config/env'
import connectDB from './lib/db'
import { seedInitialTurfs, seedSuperAdmin } from './lib/seed'
import AppError from './utils/AppError'

async function validateSecrets() {
  const minLength = 32
  if (env.JWT_SECRET.length < minLength || env.JWT_REFRESH_SECRET.length < minLength) {
    console.error('❌ Security Alert: JWT secrets are too short!')
    throw new AppError('Insecure JWT secrets. Please provide secretes of at least 32 character', 500)
  }
  console.log('✅ JWT secrets security check passed')
}

async function start() {
  try {
    await validateSecrets()
    await connectDB() // ensure DB is ready before accepting requests
    await seedSuperAdmin() // ensure manager exist
    await seedInitialTurfs()
    app.listen(env.PORT, () => console.log(`🚀 Server running at http://localhost:${env.PORT}`))
  }
  catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

start()
