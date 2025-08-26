import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../app'
import { Otp } from '../models/Otp'

describe('auth Routes - Integration Tests', () => {
  const newUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  }

  it('should register, verify, and login a user successfully', async () => {
    // 1. Register the user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(newUser)
    expect(registerRes.status).toBe(201)

    // 2. Find the OTP from the database
    const otpEntry = await Otp.findOne({ email: newUser.email })
    const otpCode = otpEntry!.otp

    // 3. Verify the OTP
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ email: newUser.email, otp: otpCode })
    expect(verifyRes.status).toBe(200)
    expect(verifyRes.body.accessToken).toBeDefined()

    const accessToken = verifyRes.body.accessToken

    // Get the user's ID from the verification response to check against later.
    const userId = verifyRes.body.user.id
    expect(userId).toBeDefined()

    // 4. Test a protected route with the new token
    const protectedRes = await request(app)
      .get('/api/v1/protected')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(protectedRes.status).toBe(200)

    // Check for the user's ID, which is in the token, instead of the email.
    expect(protectedRes.body.user.id).toBe(userId)
  })

  it('should prevent login for an unverified user', async () => {
    await request(app).post('/api/v1/auth/register').send(newUser)

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: newUser.email, password: newUser.password })

    expect(loginRes.status).toBe(403)
    expect(loginRes.body.message).toContain('Your account has not verified')
  })
})
