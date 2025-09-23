import { Router } from 'express'
import {
  createBookingHandler,
  getMyBookingDetailsHandler,
  getMyBookingHandler,
  updateBookingStatusHandler,
} from '../controllers/bookingController'
import { requireAuth } from '../middlewares/authMiddleware'

const bookingRouter = Router()

bookingRouter.post('/', requireAuth, createBookingHandler)
bookingRouter.get('/my-bookings', requireAuth, getMyBookingHandler)
bookingRouter.get('/:id', requireAuth, getMyBookingDetailsHandler)
bookingRouter.patch('/:id/status', requireAuth, updateBookingStatusHandler)

export default bookingRouter
