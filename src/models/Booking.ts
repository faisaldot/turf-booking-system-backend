import mongoose from 'mongoose'

export interface IBooking extends mongoose.Document {
  user: mongoose.Types.ObjectId
  turf: mongoose.Types.ObjectId
  date: Date
  startTime: string
  endTime: string

  appliedPricePerSlot: number
  totalPrice: number
  pricingRule: string
  dayType: string

  status: 'pending' | 'confirmed' | 'cancelled'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
}

const bookingSchema = new mongoose.Schema<IBooking>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },

  appliedPricePerSlot: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  pricingRule: { type: String, required: true },
  dayType: { type: String, required: true },

  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'] },
}, { timestamps: true })

// Index for optimize availability checks
bookingSchema.index({ turf: 1, date: 1, startTime: 1 })

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema)
