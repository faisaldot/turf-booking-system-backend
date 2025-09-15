import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'
import { requireAuth } from './middlewares/authMiddleware'
import { errorHandler, notFound } from './middlewares/errorHandler'
import adminRouter from './routes/adminRoutes'
import authRouter from './routes/authRoutes'
import bookingRouter from './routes/bookingRoutes'
import paymentRouter from './routes/paymentRoutes'
import turfRouter from './routes/turfRoutes'
import userRouter from './routes/userRoutes'

const app = express()

// Trust proxy (important for cookies in production behind reverse proxy)
app.set('trust proxy', 1)

// Middlewares
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// FIXED: Configure cookie parser properly
app.use(cookieParser())

// FIXED: Enhanced CORS configuration for cookies
const corsOptions = {
  origin(origin: string | undefined, callback: (error: Error | null, success?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin)
      return callback(null, true)

    const allowedOrigins = [
      env.CLIENT_URL,

      'http://localhost:5173', // Vite default
      'http://localhost:5174', // Vite alternative
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ]

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    }
    else {
      console.warn(`CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // This is crucial for cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
  ],
  exposedHeaders: ['Set-Cookie'],
}

app.use(cors(corsOptions))

// FIXED: Enhanced helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\''],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}))

app.use(morgan('dev'))

// Health check route
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    now: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  })
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
// Payment routes
app.use('/api/v1/payments', paymentRouter)
// Admin routes
app.use('/api/v1/admin', adminRouter)

// 404 + error handler
app.use(notFound)
app.use(errorHandler)

export default app
