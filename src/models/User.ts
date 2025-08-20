import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

export interface IUser extends mongoose.Document {
  name: string
  email: string
  password: string
  phone?: string
  role: 'user' | 'admin' | 'manager'
  isVerified: boolean
  profilePicture?: string
  comparePassword: (candidate: string) => Promise<boolean>
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin', 'manager'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  profilePicture: { type: String },
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

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password)
}

export const User = mongoose.model<IUser>('User', userSchema)
