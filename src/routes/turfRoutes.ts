import { Router } from 'express'

import { getTurfAvailabilityHandler } from '../controllers/bookingController'
import {
  createTurfHandler,
  deleteTurfHandler,
  getAllTurfsHandler,
  getTurfFlexibleHandler,
  getTurfHandler,
  updateTurfHandler,
} from '../controllers/turfController'
import { requireAuth } from '../middlewares/authMiddleware'
import { permitRoles } from '../middlewares/roleMiddleware'

const turfRouter = Router()

// Public
turfRouter.get('/', getAllTurfsHandler)
turfRouter.get('/:id/availability', getTurfAvailabilityHandler)
turfRouter.get('/:slug', getTurfHandler)
turfRouter.get('/:id', getTurfFlexibleHandler)

// Admin/Manager
turfRouter.post('/', requireAuth, permitRoles('admin', 'manager'), createTurfHandler)
turfRouter.patch('/:id', requireAuth, permitRoles('admin', 'manager'), updateTurfHandler)
turfRouter.delete('/:id', requireAuth, permitRoles('admin', 'manager'), deleteTurfHandler)

export default turfRouter
