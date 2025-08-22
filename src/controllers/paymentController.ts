import type { Request, Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import SSLCommerzPayment from 'sslcommerz-lts'
import { env } from '../config/env'
import { Booking } from '../models/Booking'
import { Payment } from '../models/Payment'
import { User } from '../models/User'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

const sslcz = new SSLCommerzPayment(env.SSL_STORE_ID!, env.SSL_STORE_PASSWORD!, env.SSL_IS_LIVE)

// POST /api/v1/payments/init/:bookingID
export const initialPaymentHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bookingID } = req.params

  const user = await User.findById(req.user!.id)
  if (!user) {
    throw new AppError('Authenticated user not found.', 404)
  }

  const booking = await Booking.findById(bookingID)
  if (!booking) {
    throw new AppError('Booking not found', 404)
  }

  // Check if the booking belongs to the authenticate user
  if (String(booking.user) !== req.user?.id) {
    throw new AppError('Forbidden: This booking does not belongs to you.', 403)
  }

  const transactionId = `turf-booking-${crypto.randomUUID()}`

  const paymentData = {
    total_amount: booking.totalPrice,
    currency: 'BDT',
    tran_id: transactionId,
    success_url: `${req.protocol}://${req.get('host')}/api/v1/payments/success/${transactionId}`,
    fail_url: `${req.protocol}://${req.get('host')}/api/v1/payments/fail/${transactionId}`,
    cancel_url: `${req.protocol}://${req.get('host')}/api/v1/payments/cancel/${transactionId}`,
    ipn_url: '/ipn', // Optional: for server-to-server notifications
    shipping_method: 'No',
    product_name: 'Turf Slot Booking',
    product_category: 'Service',
    product_profile: 'general',
    cus_name: user.name,
    cus_email: user.email,
    cus_add1: 'N/A',
    cus_city: 'N/A',
    cus_country: 'Bangladesh',
    cus_phone: 'N/A',
  }

  // Create a new payment record in the database
  await Payment.create({
    booking: bookingID,
    transactionId,
    amount: booking.totalPrice,
    sataus: 'pending',
  })

  const apiResponse = await sslcz.init(paymentData)
  // The response will contain a GatewayPageURL to which we need to redirect the user
  if (apiResponse.status === 'SUCCESS') {
    return res.status(200).json({ url: apiResponse.GatewayPageURL })
  }
  else {
    throw new AppError('Failed to initiate payment.', 500)
  }
})

// POST /api/v1/payments/success/:transactionId
export const paymentSuccessHandler = asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.params

  const payment = await Payment.findOne({ transactionId })
  if (!payment) {
    throw new AppError('Payment record not found', 404)
  }

  // Update payment sataus
  payment.status = 'success'
  payment.gatewayData = req.body
  await payment.save()

  // Update booking status
  await Booking.findByIdAndUpdate(payment.booking, {
    status: 'confirmed',
    paymentStatus: 'paid',
  })

  // Redirect to the frontend success page
  res.redirect(`${env.CLIENT_URL}/booking-success?transactionId=${transactionId}`)
})
// POST /api/v1/payments/fail/:transactionId
export const paymentFailHandler = asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.params

  await Payment.findOneAndUpdate({ transactionId }, { status: 'failed', gatewayData: req.body })

  // Redirect to the frontend success page
  res.redirect(`${env.CLIENT_URL}/booking-failed?transactionId=${transactionId}`)
})

// POST /api/v1/payments/cancel/:transactionId
export const paymentCancelHandler = asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.params

  await Payment.findOneAndUpdate({ transactionId }, { status: 'cancelled', gatewayData: req.body })

  // Redirect to the frontend cancellation page
  res.redirect(`${env.CLIENT_URL}/booking-cancelled`)
})
