import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { env } from './config/env'
import { requireAuth } from './middlewares/authMiddleware'
import { errorHandler, notFound } from './middlewares/errorHandler'
import authRouter from './routes/authRoutes'
import bookingRouter from './routes/bookingRoutes'
import turfRouter from './routes/turfRoutes'
import userRouter from './routes/userRoutes'

const app = express()

// Middlewares
app.use(morgan('dev'))
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Health check route
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', now: new Date().toISOString() })
})

// API routes
app.get('/api/v1/protected', requireAuth, (req, res) => {
  res.json({ message: 'You are authenticated', user: (req as any).user })
})

// Auth routes
app.use('/api/v1/auth', authRouter)
// User routes
app.use('/api/v1/users', userRouter)
// Turf routes
app.use('/api/v1/turfs', turfRouter)
// Booking routes
app.use('/api/v1/bookings', bookingRouter)

// 404 + error handler
app.use(notFound)
app.use(errorHandler)

export default app
