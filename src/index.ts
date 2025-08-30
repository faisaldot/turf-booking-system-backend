import app from './app'
import { env } from './config/env'
import connectDB from './lib/db'
import { seedInitialTurfs, seedSuperAdmin } from './lib/seeder'

async function start() {
  try {
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
