import mongoose from 'mongoose'

export interface IPayment extends mongoose.Document {
  booking: mongoose.Types.ObjectId
  transactionId: string
  amount: number
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  gatewayData?: object
}

const paymentSchema = new mongoose.Schema<IPayment>({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  transactionId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending',
  },
  gatewayData: { type: Object },

}, { timestamps: true })

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema)
