import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { env } from './config/env'

const app = express()

// Middleware
app.use(morgan('dev'))
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health route
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
  })
})

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`)
})
