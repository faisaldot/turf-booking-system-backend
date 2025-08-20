import app from './app'
import { env } from './config/env'
import connectDB from './lib/db'

async function start() {
  try {
    await connectDB() // ensure DB is ready before accepting requests
    app.listen(env.PORT, () => console.log(`🚀 Server running at http://localhost:${env.PORT}`))
  }
  catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

start()
