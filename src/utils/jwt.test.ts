import { describe, expect, it } from 'vitest'
import AppError from './AppError'
import { signAccessToken, verifyAccessToken } from './jwt'

describe('jWT Utilities', () => {
  const payload = { id: '123', role: 'user' }

  it('should sign and verify an access token successfully', () => {
    // 1. sign a token
    const token = signAccessToken(payload)
    expect(token).toBeTypeOf('string')

    // 2. verify the token
    const decoded = verifyAccessToken(token)

    // 3. assert the content are correct
    expect(decoded.id).toBe(payload.id)
    expect(decoded.role).toBe(payload.role)

    // We also check that the 'iat'  (issued at) and 'exp' (expires at) fields exist
    expect(decoded.iat).toBeDefined()
    expect(decoded.exp).toBeDefined()
  })

  it('should throw an error for an invalid or malformed token', () => {
    const invalidToken = 'this.is.not.valid.token'

    // We expect the function to throw an AppError
    expect(() => verifyAccessToken(invalidToken)).toThrow(AppError)
    expect(() => verifyAccessToken(invalidToken)).toThrow(`Invalid or expired token`)
  })
})
