import { Router } from 'express'

import { initialPaymentHandler, paymentCancelHandler, paymentFailHandler, paymentSuccessHandler, paymentWebhookHandler } from '../controllers/paymentController'
import { requireAuth } from '../middlewares/authMiddleware'

const paymentRouter = Router()

//  Temporary debug routes start (Debug routes (remove in production)) ---------
if (process.env.NODE_ENV === 'development') {
  // Test redirect functionality
  paymentRouter.get('/test-redirect/:transactionId', (req, res) => {
    const { transactionId } = req.params
    console.log(`🧪 Testing redirect for transaction: ${transactionId}`)
    res.redirect(`${process.env.CLIENT_URL}/booking-success?transactionId=${transactionId}&test=true`)
  })

  // Test direct access to success page
  paymentRouter.get('/debug/success/:transactionId', (req, res) => {
    res.json({
      message: 'Debug success endpoint reached',
      transactionId: req.params.transactionId,
      query: req.query,
      body: req.body,
      headers: req.headers,
    })
  })

  // Test SSL Commerz connectivity
  paymentRouter.get('/debug/ssl-test', async (req, res) => {
    try {
      // Test SSL Commerz connection
      const testData = {
        total_amount: 100,
        currency: 'BDT',
        tran_id: `test-${Date.now()}`,
        success_url: 'https://example.com/success',
        fail_url: 'https://example.com/fail',
        cancel_url: 'https://example.com/cancel',
        ipn_url: 'https://example.com/webhook',
        shipping_method: 'No',
        product_name: 'Test',
        product_category: 'Service',
        product_profile: 'general',
        cus_name: 'Test User',
        cus_email: 'test@example.com',
        cus_add1: 'N/A',
        cus_city: 'N/A',
        cus_country: 'Bangladesh',
        cus_phone: 'N/A',
      }

      // eslint-disable-next-line ts/no-require-imports
      const sslcz = new (require('sslcommerz-lts'))(
        process.env.SSL_STORE_ID,
        process.env.SSL_STORE_PASSWORD,
        process.env.SSL_IS_LIVE,
      )

      const result = await sslcz.init(testData)
      res.json({
        ssl_test: 'SUCCESS',
        ssl_response: result,
        environment: {
          SSL_STORE_ID: process.env.SSL_STORE_ID,
          SSL_IS_LIVE: process.env.SSL_IS_LIVE,
          SERVER_URL: process.env.SERVER_URL,
          CLIENT_URL: process.env.CLIENT_URL,
        },
      })
    }
    catch (error: any) {
      res.status(500).json({
        ssl_test: 'FAILED',
        error: error.message,
        stack: error.stack,
      })
    }
  })
}
//  Temporary debug routes end -----------

// Initialize a payment for a specific booking
paymentRouter.post('/init/:bookingId', requireAuth, initialPaymentHandler)

// SSLCommerz callback routes - Support both GET and POST methods
// SSL Commerz typically uses GET for redirects, POST for webhooks
paymentRouter.get('/success/:transactionId', paymentSuccessHandler)
paymentRouter.post('/success/:transactionId', paymentSuccessHandler)

paymentRouter.get('/fail/:transactionId', paymentFailHandler)
paymentRouter.post('/fail/:transactionId', paymentFailHandler)

paymentRouter.get('/cancel/:transactionId', paymentCancelHandler)
paymentRouter.post('/cancel/:transactionId', paymentCancelHandler)

// webhook route - POST only
paymentRouter.post('/webhook', paymentWebhookHandler)

export default paymentRouter
