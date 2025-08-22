import { Router } from 'express'

import { initialPaymentHandler, paymentCancelHandler, paymentFailHandler, paymentSuccessHandler } from '../controllers/paymentController'
import { requireAuth } from '../middlewares/authMiddleware'

const paymentRouter = Router()

// Initialize a payment for a specific booking
paymentRouter.post('/init/:bookingId', requireAuth, initialPaymentHandler)

// SSLCommerze callback routes - These are hit by the user's browser after  redirection
paymentRouter.post('/success/:transactionId', paymentSuccessHandler)
paymentRouter.post('/fail/:transactionId', paymentFailHandler)
paymentRouter.post('/cancel/:transactionId', paymentCancelHandler)

export default paymentRouter
