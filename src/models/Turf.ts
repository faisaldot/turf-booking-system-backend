import mongoose from 'mongoose'

export interface ITurf extends mongoose.Document {
  name: string
  location: string
  description?: string
  pricePerSlot: number
  amenities: string[]
  images: string[]
  operatingHours: { start: string, end: string }
  managedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const turfSchema = new mongoose.Schema<ITurf>({
  name: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, default: '' },
  pricePerSlot: { type: Number, required: true },
  amenities: { type: [String], default: [] },
  images: { type: [String], default: [] },
  operatingHours: {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

export const Turf = mongoose.model<ITurf>('Turf', turfSchema)
