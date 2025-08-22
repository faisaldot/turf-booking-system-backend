import { Router } from 'express'
import { createAdminHandler, updateUserStatusHandler } from '../controllers/adminController'
import { getMyProfile, updateMyProfile } from '../controllers/userController'
import { requireAuth } from '../middlewares/authMiddleware'
import { permitRoles } from '../middlewares/roleMiddleware'

const userRouter = Router()

// Routes for the authenticate user ('me')
userRouter.get('/me', requireAuth, getMyProfile)
userRouter.patch('/me', requireAuth, updateMyProfile)

// Routes for manager to create new admins
userRouter.post('/admins', requireAuth, permitRoles('manager'), createAdminHandler)

// Routes for manager to get all users
userRouter.get('/', requireAuth, permitRoles('manager'))

// Routes for manager to update users status
userRouter.patch('/:id/status', requireAuth, permitRoles('manager'), updateUserStatusHandler)
export default userRouter
