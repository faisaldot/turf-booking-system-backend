import { Router } from 'express'
import {
  cancelBookingHandler,
  createAdminBookingHandler,
  createAdminHandler,
  deleteBookingHandler,
  getAdminBookingsHandler,
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

// Booking management routes for admins
adminRouter.get('/bookings', permitRoles('admin', 'manager'), getAdminBookingsHandler)
adminRouter.post('/bookings', permitRoles('admin', 'manager'), createAdminBookingHandler)
adminRouter.patch('/bookings/:id/cancel', permitRoles('admin', 'manager'), cancelBookingHandler)
adminRouter.delete('/bookings/:id', permitRoles('manager'), deleteBookingHandler) // Only managers can delete

// User management routes (manager only)
adminRouter.get('/users', permitRoles('manager'), getAllUsersHandler)
adminRouter.patch('/users/:id', permitRoles('manager'), updateUserHandler)
adminRouter.post('/users/admin', permitRoles('manager'), createAdminHandler)
adminRouter.patch('/users/:id/status', permitRoles('manager'), updateUserStatusHandler)

export default adminRouter
