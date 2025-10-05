import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
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
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

//  Configure cookie parser properly
app.use(cookieParser())

// Enhanced CORS configuration for cookies
const corsOptions = {
  origin(origin: string | undefined, callback: (error: Error | null, success?: boolean) => void) {
    if (!origin) {
      return callback(null, true)
    }

    const allowedOrigins = [
      env.CLIENT_URL,
      env.SERVER_URL,
      env.PUBLIC_URL,
      'https://khelbinaki.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://sandbox.sslcommerz.com', // SSLCommerz sandbox
      'https://securepay.sslcommerz.com', // SSLCommerz production
    ].filter(Boolean) // Remove undefined values

    // Allow any localhost in development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true)
    }

    // Allow ngrok/localtunnel in development
    if (env.NODE_ENV !== 'production' && (origin.includes('ngrok') || origin.includes('loca.lt'))) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    }
    else {
      console.warn(`❌ CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // Essential for cookies
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
  preflightContinue: false,
  optionsSuccessStatus: 204,
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

// Cookies Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    cookies: req.cookies,
    origin: req.headers.origin,
  })
  next()
})

// Health check route
app.get('/api/v1/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
  }

  res.status(health.database === 'connected' ? 200 : 503).json(health)
})

// API routes
app.get('/api/v1/protected', requireAuth, (req, res) => {
  res.json({
    message: 'You are authenticated',
    data: {
      user: (req as any).user,
    },
  })
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
