/* eslint-disable style/no-trailing-spaces */
/* eslint-disable style/indent */
import path from 'node:path'
import dotenv from 'dotenv'

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: path.resolve(process.cwd(), envFile) })

// Also load .env.local if it exists (for local overrides)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

export const env = {
  // Basic Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT ?? 9000),

  // Database
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/turf_booking_dev',
  DB_MAX_POOL_SIZE: Number(process.env.DB_MAX_POOL_SIZE ?? 10),
  DB_MIN_POOL_SIZE: Number(process.env.DB_MIN_POOL_SIZE ?? 2),

  // URLs
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',
<<<<<<< HEAD
  SERVER_URL: process.env.SERVER_URL ?? 'http://localhost:9000',
  PUBLIC_URL: process.env.PUBLIC_URL,

=======
  SERVER_URL: process.env.SERVER_URL ?? 'http://localhost:9000', 
   // eita chnage hobe ei khane ngork er ta hobe testing purpose a and both .env.production .env . development
>>>>>>> 7630f43f571813a4935d320c505cd2d042134052
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET ?? 'fallback-dev-secret-key-minimum-32-characters',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'fallback-dev-refresh-secret-key-minimum-32-characters',
  REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN ?? '7d',

  // Security
  BCRYPT_SALT_ROUND: Number(process.env.BCRYPT_SALT_ROUND ?? 10),
  SECURE_COOKIES: process.env.SECURE_COOKIES === 'true',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,

  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],

  // SSLCommerz
  SSL_STORE_ID: process.env.SSL_STORE_ID,
  SSL_STORE_PASSWORD: process.env.SSL_STORE_PASSWORD,
  SSL_IS_LIVE: process.env.SSL_IS_LIVE === 'true',

  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'localhost',
  EMAIL_PORT: Number(process.env.EMAIL_PORT ?? 1025),
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || 'Khelbi Naki BD <no-reply@khelbinakibd.com>',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Manager Account
  MANAGER_NAME: process.env.MANAGER_NAME || 'Super Admin',
  MANAGER_EMAIL: process.env.MANAGER_EMAIL || 'admin@example.com',
  MANAGER_PASSWORD: process.env.MANAGER_PASSWORD || 'defaultpassword',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),

  // Development/Debug
  DEBUG_MODE: process.env.DEBUG_MODE === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Performance
  COMPRESSION: process.env.COMPRESSION === 'true',
  CACHE_TTL: Number(process.env.CACHE_TTL ?? 3600),
}

// Enhanced production validation
if (process.env.NODE_ENV === 'production') {
  const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'MONGODB_URI',
    'CLIENT_URL',
    'SERVER_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'MANAGER_EMAIL',
    'MANAGER_PASSWORD',
    'MANAGER_NAME',
  ]

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`)
    }
  }

  // Validate JWT secrets length
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long in production')
  }
  if (env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long in production')
  }

  // Validate URLs
  if (!env.CLIENT_URL.startsWith('https://') && !env.CLIENT_URL.startsWith('http://localhost')) {
    console.warn('⚠️  CLIENT_URL should use HTTPS in production')
  }
  if (!env.SERVER_URL.startsWith('https://') && !env.SERVER_URL.startsWith('http://localhost')) {
    console.warn('⚠️  SERVER_URL should use HTTPS in production')
  }

  // Validate manager password strength
  if (env.MANAGER_PASSWORD.length < 8) {
    throw new Error('MANAGER_PASSWORD must be at least 8 characters long in production')
  }
}

// Development warnings
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode configuration loaded')
  if (env.JWT_SECRET.includes('fallback')) {
    console.warn('⚠️  Using fallback JWT secrets. Consider setting proper secrets in .env.development')
  }
}
