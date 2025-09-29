import mongoose from 'mongoose'
import { Booking } from '../models/Booking'
import { Turf } from '../models/Turf'
import { User } from '../models/User'

export async function getAdminDashboardStats(adminId: string) {
  console.log('🔍 DEBUG: getAdminDashboardStats called for:', adminId)

  const adminObjectId = new mongoose.Types.ObjectId(adminId)
  console.log('🔍 Admin ObjectId:', adminObjectId)

  // Step 1: Find all turfs managed by this admin
  const turfs = await Turf.find({ admins: adminObjectId }).select('_id name')
  console.log('🔍 Found turfs:', turfs.length)
  console.log('🔍 Turf details:', turfs.map(t => ({ id: t._id, name: t.name })))

  const turfIds = turfs.map(turf => turf._id)

  if (turfIds.length === 0) {
    console.log('🔍 No turfs found for admin, returning empty stats')
    return {
      totalTurfs: 0,
      totalRevenue: 0,
      totalBookings: 0,
      upcomingBookings: 0,
      recentBookings: [],
      monthlyBookings: [],
      revenueByDayType: {
        'sunday-thursday': 0,
        'friday-saturday': 0,
      },
      bookingStatusCounts: {
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        expired: 0,
      },
    }
  }

  // DEBUG: Check raw bookings data
  const allBookings = await Booking.find({ turf: { $in: turfIds } })
  console.log('🔍 Total bookings found:', allBookings.length)
  console.log('🔍 Booking statuses:', allBookings.map(b => ({
    status: b.status,
    paymentStatus: b.paymentStatus,
    totalPrice: b.totalPrice,
  })))

  // Step 2: Run aggregation with logging
  console.log('🔍 Running aggregation pipeline...')

  const [statsResult, recentBookings, monthlyStats] = await Promise.all([
    // Main statistics aggregation
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

    // Recent bookings
    Booking.find({ turf: { $in: turfIds } })
      .populate('user', 'name email')
      .populate('turf', 'name')
      .sort({ createdAt: -1 })
      .limit(10),

    // Monthly stats
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

  console.log('🔍 Stats result:', statsResult)
  console.log('🔍 Recent bookings count:', recentBookings.length)
  console.log('🔍 Monthly stats count:', monthlyStats.length)

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

  const finalStats = {
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

  console.log('🔍 Final stats being returned:', JSON.stringify(finalStats, null, 2))
  return finalStats
}

// ENHANCED: Calculate dashboard statistics for the platform manager (super admin)
export async function getManagerDashboardStats() {
  // Run all promises in parallel for better performance
  const [userCount, adminCount, turfCount, bookingStats, revenueStats] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'admin' }),
    Turf.countDocuments({ isActive: true }),

    // Booking statistics
    Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
    ]),

    // Revenue statistics
    Booking.aggregate([
      {
        $match: { paymentStatus: 'paid' },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          averageBookingValue: { $avg: '$totalPrice' },
        },
      },
    ]),
  ])

  const bookingStat = bookingStats[0] || {
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
  }

  const revenueStat = revenueStats[0] || {
    totalRevenue: 0,
    averageBookingValue: 0,
  }

  return {
    // User statistics
    totalUsers: userCount,
    totalAdmins: adminCount,
    totalTurfs: turfCount,

    // Booking statistics
    totalBookings: bookingStat.totalBookings,
    confirmedBookings: bookingStat.confirmedBookings,
    pendingBookings: bookingStat.pendingBookings,
    cancelledBookings: bookingStat.cancelledBookings,

    // Revenue statistics
    totalRevenue: revenueStat.totalRevenue,
    averageBookingValue: Math.round(revenueStat.averageBookingValue || 0),
  }
}
