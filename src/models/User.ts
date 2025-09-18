import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

export interface IUser extends mongoose.Document {
  name: string
  email: string
  password: string
  phone?: string
  role: 'user' | 'admin' | 'manager'
  isVerified: boolean
  isActive: boolean
  profilePicture?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  comparePassword: (candidate: string) => Promise<boolean>
  createPasswordResetToken: () => string
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin', 'manager'], default: 'user' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  profilePicture: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: Date,
}, { timestamps: true })

// Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Method for compare password
userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password)
}

// Method to genereate and hash password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  // Token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000
  return resetToken
}

export const User = mongoose.model<IUser>('User', userSchema)
