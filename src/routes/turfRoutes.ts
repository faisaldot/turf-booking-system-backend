import { Router } from 'express'

import {
  createTurfHandler,
  deleteTurfHandler,
  getAllTurfsHandler,
  getTurfHandler,
  updateTurfHandler,
} from '../controllers/turfController'
import { requireAuth } from '../middlewares/authMiddleware'
import { permitRoles } from '../middlewares/roleMiddleware'

const turfRouter = Router()

// Public
turfRouter.get('/', getAllTurfsHandler)
turfRouter.get('/:id', getTurfHandler)

// Admin/Manager
turfRouter.post('/', requireAuth, permitRoles('admin', 'manager'), createTurfHandler)
turfRouter.post('/:id', requireAuth, permitRoles('admin', 'manager'), updateTurfHandler)
turfRouter.post('/:id', requireAuth, permitRoles('admin', 'manager'), deleteTurfHandler)

export default turfRouter
