import dotenv from 'dotenv'

dotenv.config()

export const env = {
  PORT: Number(process.env.PORT ?? 9000),
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/turf_booking',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1h',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev-secret',
  REFRESH_EXPIRES_IN: process.env.REFRESH_EXPIRES_IN ?? '7d',
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',
  SSL_STORE_ID: process.env.SSL_STORE_ID,
  SSL_STORE_PASSWORD: process.env.SSL_STORE_PASSWORD,
  SSL_IS_LIVE: process.env.SSL_IS_LIVE === 'true', // Convert string to boolean
}
