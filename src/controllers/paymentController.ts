import type { Request, Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import type { ITurf } from '../models/Turf'
import type { IUser } from '../models/User'
import mongoose from 'mongoose'
import SSLCommerzPayment from 'sslcommerz-lts'
import { env } from '../config/env'
import { Booking } from '../models/Booking'
import { Payment } from '../models/Payment'
import { User } from '../models/User'
import { sendBookingConfirmationEmail } from '../services/emailServices'
import AppError from '../utils/AppError'
import asyncHandler from '../utils/asyncHandler'

const sslcz = new SSLCommerzPayment(env.SSL_STORE_ID!, env.SSL_STORE_PASSWORD!, env.SSL_IS_LIVE)

// POST /api/v1/payments/init/:bookingID
export const initialPaymentHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bookingId } = req.params

  const booking = await Booking.findById(bookingId)
  if (!booking) {
    throw new AppError('Booking not found', 404)
  }

  const user = await User.findById(req.user!.id)
  if (!user) {
    throw new AppError('Authenticated user not found.', 404)
  }

  // Check if the booking belongs to the authenticate user
  if (String(booking.user) !== req.user?.id) {
    throw new AppError('Forbidden: This booking does not belongs to you.', 403)
  }

  if (booking.paymentStatus === 'paid') {
    throw new AppError('This booking has already been paid for.', 400)
  }

  const transactionId = `turf-booking-${crypto.randomUUID()}`
  const serverUrl = 'https://2910ea0ddbaa.ngrok-free.app'

  const paymentData = {
    total_amount: booking.totalPrice,
    currency: 'BDT',
    tran_id: transactionId,
    success_url: `${serverUrl}/api/v1/payments/success/${transactionId}`,
    fail_url: `${serverUrl}/api/v1/payments/fail/${transactionId}`,
    cancel_url: `${serverUrl}/api/v1/payments/cancel/${transactionId}`,
    ipn_url: `${serverUrl}/api/v1/payments/webhook`,
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

  await Payment.findOneAndUpdate({ booking: bookingId }, {
    transactionId,
    amount: booking.totalPrice,
    status: 'pending',
  }, { upsert: true, new: true })

  const apiResponse = await sslcz.init(paymentData)
  // The response will contain a GatewayPageURL to which we need to redirect the user
  if (apiResponse.status === 'SUCCESS') {
    return res.status(200).json({ url: apiResponse.GatewayPageURL })
  }
  else {
    throw new AppError('Failed to initiate payment.', 500)
  }
})

// POST /api/v1/payments/webhook
export const paymentWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  // The data SSLCommerz sends is URL-encoded, not JSON
  const notificationData = req.body

  // first, check if the notification has a valid transection status
  if (notificationData.status !== 'VALID') {
    console.log(`Webhook received with status: ${notificationData.status}`)
    // silently ignore failed or cancelled transaction from the webhook
    // as our fail/cancel URLs will handle the user redirect
    return res.status(200).send('Webhook received.')
  }

  // Validate the payment with SSLCommerz to ensure it's genuine
  const validationResponse = await sslcz.validate(notificationData)
  if (validationResponse.status !== 'VALID') {
    // This could be a fraudulent attempt
    console.error(`Fraudulent IPN detected for tran_id: ${notificationData.tran_id}`)
    throw new AppError('Payment validation failed', 400)
  }

  const { tran_id: transactionId } = notificationData

  // Find the payment record
  const payment = await Payment.findOne({ transactionId })
  if (!payment) {
    // This can happen but is unlikely. Log for investigation.
    console.error(`Payment record not found for webhook tran_id: ${transactionId}`)
    throw new AppError('Payment record not found', 404)
  }

  // Idempotency Check: If already processed, do noting.
  if (payment.status === 'success') {
    console.log(`Webhook for ${transactionId} already processed`)
    return res.status(200).send('Webhook already processed.')
  }

  // Use a transaction to ensure atomicity
  const session = await mongoose.startSession()
  session.startTransaction()

  // Update payment and booking status (THE SOURCE OF TRUTH)

  try {
    payment.status = 'success'
    payment.gatewayData = notificationData
    await payment.save({ session })

    const updatedBooking = await Booking.findByIdAndUpdate(payment.booking, {
      status: 'confirmed',
      paymentStatus: 'paid',
    }, { new: true, session }).populate<{ user: IUser, turf: ITurf }>('user turf') as any

    if (!updatedBooking) {
      throw new AppError('Booking not found during webhook proccessing', 404)
    }

    // Send the confirmation email
    await sendBookingConfirmationEmail(updatedBooking.user, updatedBooking, updatedBooking.turf)

    await session.commitTransaction()
    console.log(`✅ Payment confirmed for booking ${payment.booking} via webhook.`)
    res.status(200).send('Payment confiremed successfully.')
  }
  catch (error) {
    await session.abortTransaction()
    console.error('Error during webhook processing:', error)
    throw error
  }
  finally {
    session.endSession()
  }
})

// POST /api/v1/payments/success/:transactionId
export const paymentSuccessHandler = asyncHandler(async (req: Request, res: Response) => {
  const { transactionId } = req.params

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
