import { Router } from 'express'
import { forgotPassword, login, logout, refreshToken, register, resetPassword } from '../controllers/authController'
import { requireAuth } from '../middlewares/authMiddleware'

const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/refresh-token', refreshToken)

authRouter.post('/forgot-password', forgotPassword)
authRouter.patch('/reset-password/:token', resetPassword)
authRouter.post('/logout', requireAuth, logout)

export default authRouter
