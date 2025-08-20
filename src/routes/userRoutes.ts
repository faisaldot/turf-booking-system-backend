import { Router } from 'express'
import { getMyProfile, updateMyProfile } from '../controllers/userController'
import { requireAuth } from '../middlewares/authMiddleware'

const userRouter = Router()

userRouter.get('/me', requireAuth, getMyProfile)
userRouter.patch('/me', requireAuth, updateMyProfile)

export default userRouter
