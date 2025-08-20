import { Router } from 'express'
import { login, refreshToken, register } from '../controllers/authController'

const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/refresh-token', refreshToken)

export default authRouter
