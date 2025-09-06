import { Router } from 'express'
import { forgotPassword, login, logout, refreshToken, register, resetPassword, verifyOtp } from '../controllers/authController'
import { requireAuth } from '../middlewares/authMiddleware'
import { authRateLimit } from '../middlewares/rateLimitMiddleware'

const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/verify-otp', verifyOtp)
authRouter.post('/login', authRateLimit, login)
authRouter.post('/refresh-token', refreshToken)

authRouter.post('/forgot-password', forgotPassword)
authRouter.patch('/reset-password/:token', resetPassword)
authRouter.post('/logout', requireAuth, logout)

export default authRouter
