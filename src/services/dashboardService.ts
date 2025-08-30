import mongoose from 'mongoose'
import { Booking } from '../models/Booking'
import { Turf } from '../models/Turf'
import { User } from '../models/User'

// Calculate dashboard statistics for a specific turf admin.
export async function getAdminDashboardStats(adminId: string) {
  const adminObjectId = new mongoose.Types.ObjectId(adminId)

  // Step 1: Find all turfs manage by this admin
  const turfs = await Turf.find({ admins: adminObjectId }).select('_id')
  const turfIds = turfs.map(turf => turf._id)

  if (turfIds.length === 0) {
    return {
      totalRevenue: 0,
      totalBookings: 0,
      upcomingBookings: 0,
      revenueByDayType: {
        'sunday-thursday': 0,
        'friday-saturday': 0,
      },
      bookingStatusCounts: {
        pending: 0,
        confirmed: 0,
        cancelled: 0,
      },
    }
  }

  // Step 2: Use aggregation pipeline to calculate stats for those turfs
  const stats = await Booking.aggregate([
    // Match only booking for the admin's turfs
    { $match: { turf: { $in: turfIds } } },

    // Group and calculate multiple stats in one pass
    { $group: {
      _id: null, // group all document into one
      totalRevenue: {
        $sum: {
          // only sum the price if the booking is confirmed and paid
          $cond: [
            { $and: [{ $eq: ['$status', 'confirmed'] }, { $eq: ['$paymentStatus', 'paid'] }] },
            '$totalPrice',
            0,
          ],
        },
      },

      totalBookings: { $sum: 1 },

      // Count upcoming bookings
      upcomingBookings: {
        $sum: {
          $cond: [
            { $and: [{ $gte: ['$date', new Date()] }, { $eq: ['$status', 'confirmed'] }] },
            1,
            0,
          ],
        },
      },

      // Revenue breakdown by dayTypes
      revenueSundayThursday: {
        $sum: {
          $cond: [
            { $and: [{ $eq: ['$dayType', 'friday-saturday'] }, { $eq: ['$paymentStatus', 'paid'] }] },
            '$totalPrice',
            0,
          ],
        },
      },
      revenueFridaySaturday: {
        $sum: {
          $cond: [
            { $and: [{ $eq: ['$dayType', 'friday-saturday'] }, { $eq: ['$paymentStatus', 'paid'] }] },
            '$totalPrice',
            0,
          ],
        },
      },

      // Count statuses
      pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
      cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
    } },
    {
      // Reshape the output
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalBooking: 1,
        upcomingBookings: 1,
        revenueByDayType: {
          'sunday-thursday': '$revenueSundayThursday',
          'friday-saturday': '$revenueFridaySaturday',
        },
        bookingStatusCounts: {
          pending: '$pending',
          confirmed: '$confirmed',
          cancelled: '$cancelled',
        },
      },
    },
  ])

  // If there are no bookings, the aggregation will return an empty array
  return stats[0] || {
    totalRevenue: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    revenueByDayType: { 'sunday-thursday': 0, 'friday-saturday': 0 },
    bookingsStatusCounts: { pending: 0, confirmed: 0, cancelled: 0 },
  }
}

// Calculate dashboard statistics for the platform manager (super admin).
export async function getManagerDashboardStats() {
  // Run all promise in parallel for better performance
  const [userCount, turfCount, bookingResult] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Turf.countDocuments({ isActive: true }),
    Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0],
            },
          },
          totalBooking: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalBookings: 1,
        },
      },
    ]),
  ])

  const stats = bookingResult[0] || { totalRevenue: 0, totalBookings: 0 }

  return {
    totalUsers: userCount,
    totalTurfs: turfCount,
    totalRevenue: stats.totalRevenue,
    totalBookings: stats.totalBookings,
  }
}
