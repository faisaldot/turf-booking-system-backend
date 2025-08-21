import type { ITurf } from '../models/Turf'
import mongoose from 'mongoose'
import { Turf } from '../models/Turf'

// Creating new turf service
export async function createTurf(data: Partial<ITurf>) {
  const newTurf = await Turf.create(data)
  return newTurf
}

// Find all turfs services
export async function findTurfs(filters: Record<string, any> = {}) {
  const query: any = {}

  if (filters.location)
    query.location = { $regex: filters.location, $options: 'i' }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.pricePerSlot = {}
    if (filters.minPrice !== undefined)
      query.pricePerSlot.$gte = Number(filters.minPrice)
    if (filters.maxPrice !== undefined)
      query.pricePerSlot.$lte = Number(filters.maxPrice)
  }

  if (filters.amenities) {
    const amenities = Array.isArray(filters.amenities)
      ? filters.amenities
      : String(filters.amenities).split(',').map(s => s.trim())
    query.amenities = { $all: amenities }
  }
  return Turf.find(query).populate('managedBy', 'name email')
}

// Find indibiddual turf services
export async function findTurfById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }
  return Turf.findById(id).populate('managedBy', 'name email')
}

// Update turf services
export async function updateTurf(id: string, data: Partial<ITurf>) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }

  return Turf.findByIdAndUpdate(id, data, { new: true })
}

// Remove turf service
export async function removeTurf(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }

  return Turf.findByIdAndDelete(id)
}
