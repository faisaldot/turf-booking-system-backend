import { Router } from 'express'
import {
  createAdminHandler,
  getAdminDashboardHandler,
  getAllUsersHandler,
  updateUserHandler,
  updateUserStatusHandler,
  uploadTurfImageHandler,
} from '../controllers/adminController'
import { requireAuth } from '../middlewares/authMiddleware'
import { permitRoles } from '../middlewares/roleMiddleware'
import { upload } from '../services/uploadService'

const adminRouter = Router()

// This middleware applies to all routes in this file
adminRouter.use(requireAuth)

// Dashboard route (accessible by admin and manager)
adminRouter.get('/dashboard', permitRoles('admin', 'manager'), getAdminDashboardHandler)

// Turf management routes (admin and manager)
adminRouter.patch('/turfs/:id/image', permitRoles('admin', 'manager'), upload.single('image'), uploadTurfImageHandler)

// User management routes (manager only)
adminRouter.get('/users', permitRoles('manager'), getAllUsersHandler)
adminRouter.patch('/users/:id', permitRoles('manager'), updateUserHandler)

adminRouter.post('/users/admin', permitRoles('manager'), createAdminHandler)
adminRouter.patch('/users/:id/status', permitRoles('manager'), updateUserStatusHandler)

export default adminRouter
