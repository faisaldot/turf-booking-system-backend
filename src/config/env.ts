import dotenv from 'dotenv'

dotenv.config()

export const env = {
  PORT: Number(process.env.PORT ?? 9000),
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/turf_booking',
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev-secret',
  REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN ?? '7d',

  // SSLCOMMERZ
  SSL_STORE_ID: process.env.SSL_STORE_ID,
  SSL_STORE_PASSWORD: process.env.SSL_STORE_PASSWORD,
  SSL_IS_LIVE: process.env.SSL_IS_LIVE === 'true', // Convert string to boolean

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Seeder
  MANAGER_NAME: process.env.MANAGER_NAME,
  MANAGER_EMAIL: process.env.MANAGER_EMAIL,
  MANAGER_PASSWORD: process.env.MANAGER_PASSWORD,

  // Server URL
  SERVER_URL: process.env.SERVER_URL ?? '',
}

// Fail-fast in production for missing secrets
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET)
    throw new Error('JWT_SECRET must be set in production')
  if (!process.env.JWT_REFRESH_SECRET)
    throw new Error('JWT_REFRESH_SECRET must be set in production')
}
