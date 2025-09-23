import mongoose from 'mongoose'
import { Booking } from '../models/Booking'
import { Turf } from '../models/Turf'
import { User } from '../models/User'

// Calculate dashboard statistics for a specific turf admin.
export async function getAdminDashboardStats(adminId: string) {
  const adminObjectId = new mongoose.Types.ObjectId(adminId)

  // Find all turfs managed by this admin
  const turfs = await Turf.find({ admins: adminObjectId }).select('_id name')
  const turfIds = turfs.map(turf => turf._id)

  if (turfIds.length === 0) {
    return {
      totalTurfs: 0,
      totalRevenue: 0,
      totalBookings: 0,
      upcomingBookings: 0,
      recentBookings: [],
      monthlyBookings: [],
      revenueByDayType: { 'sunday-thursday': 0, 'friday-saturday': 0 },
      bookingStatusCounts: { pending: 0, confirmed: 0, cancelled: 0, expired: 0 },
    }
  }

  // Parallel queries for better performance
  const [statsResult, recentBookings, monthlyStats] = await Promise.all([
    // Main statistics
    Booking.aggregate([
      { $match: { turf: { $in: turfIds } } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'confirmed'] }, { $eq: ['$paymentStatus', 'paid'] }] },
                '$totalPrice',
                0,
              ],
            },
          },
          totalBookings: { $sum: 1 },
          upcomingBookings: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$date', new Date()] }, { $eq: ['$status', 'confirmed'] }] },
                1,
                0,
              ],
            },
          },
          revenueSundayThursday: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$dayType', 'sunday-thursday'] }, { $eq: ['$paymentStatus', 'paid'] }] },
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
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
        },
      },
    ]),

    // Recent bookings (last 10)
    Booking.find({ turf: { $in: turfIds } })
      .populate('user', 'name email')
      .populate('turf', 'name')
      .sort({ createdAt: -1 })
      .limit(10),

    // Monthly booking stats for chart
    Booking.aggregate([
      {
        $match: {
          turf: { $in: turfIds },
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]),
  ])

  const stats = statsResult[0] || {
    totalRevenue: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    revenueSundayThursday: 0,
    revenueFridaySaturday: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    expired: 0,
  }

  return {
    totalTurfs: turfs.length,
    totalRevenue: stats.totalRevenue,
    totalBookings: stats.totalBookings,
    upcomingBookings: stats.upcomingBookings,
    recentBookings,
    monthlyBookings: monthlyStats,
    revenueByDayType: {
      'sunday-thursday': stats.revenueSundayThursday,
      'friday-saturday': stats.revenueFridaySaturday,
    },
    bookingStatusCounts: {
      pending: stats.pending,
      confirmed: stats.confirmed,
      cancelled: stats.cancelled,
      expired: stats.expired,
    },
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
