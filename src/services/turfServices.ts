import type { ITurf } from '../models/Turf'
import mongoose from 'mongoose'
import { Turf } from '../models/Turf'

// Creating new turf service
export async function createTurf(data: Partial<ITurf>) {
  const newTurf = await Turf.create(data)
  return newTurf
}

// Find indibiddual turf services
export async function findTurfById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }
  return Turf.findById(id).populate('admins', 'name email')
}

// Update turf services
export async function updateTurf(id: string, data: mongoose.UpdateQuery<ITurf>) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }

  return Turf.findByIdAndUpdate(id, data, { new: true })
}

// Remove turf service
export async function deactivateTurf(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }

  return Turf.findByIdAndUpdate(id, { isActive: false }, { new: true })
}
