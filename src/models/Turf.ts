import mongoose from 'mongoose'
import slugify from 'slugify'

export interface ITurf extends mongoose.Document {
  name: string
  slug: string
  location: {
    address: string
    city: string
  }
  description?: string
  pricePerSlot: number
  amenities: string[]
  images: string[]
  operatingHours: { start: string, end: string }
  admins: mongoose.Types.ObjectId[]
  createdAt: Date
  isActive: boolean
  updatedAt: Date
}

const turfSchema = new mongoose.Schema<ITurf>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
  },
  description: { type: String, default: '' },
  pricePerSlot: { type: Number, required: true },
  amenities: { type: [String], default: [] },
  images: { type: [String], default: [] },
  operatingHours: {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true })

// Pre save hook to auto-generate the slug before saving
turfSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true })
  }
  next()
})

export const Turf = mongoose.model<ITurf>('Turf', turfSchema)
