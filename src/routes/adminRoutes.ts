import { Router } from 'express'
import { getAdminDashboardHandler } from '../controllers/adminController'
import { requireAuth } from '../middlewares/authMiddleware'
import { permitRoles } from '../middlewares/roleMiddleware'

const adminRouter = Router()

// All routes in this file are protected and require at least an 'admin' role.
adminRouter.use(requireAuth, permitRoles('admin', 'manager'))

// GET /api/v1/admin/dashboard
adminRouter.get('/dashboard', getAdminDashboardHandler)

export default adminRouter
