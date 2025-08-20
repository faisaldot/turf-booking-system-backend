import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { env } from './config/env'
import { errorHandler, notFound } from './middleware/errorHandler'
import authRouter from './routes/authRoutes'

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
// Auth routes
app.use('/api/v1/auth', authRouter)

// 404 + error handler
app.use(notFound)
app.use(errorHandler)

export default app
