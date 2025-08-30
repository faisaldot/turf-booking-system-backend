# 🏟️ Turf Booking System - Backend API

**Private Business Repository**

A comprehensive Node.js backend service for managing turf bookings with integrated payment processing, role-based access control, and real-time availability management.

Built for **Khelbi Naki BD** - Premium Turf Booking Platform

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-darkgreen.svg)
![Express](https://img.shields.io/badge/Express-5.1+-lightgrey.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)

## 🚀 Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Email verification** with OTP system using 6-digit codes
- **Password reset** with secure token-based flow
- **Role-based access control** (User, Admin, Manager)
- **Account activation/deactivation** by managers

### 🏟️ Turf Management
- **Flexible pricing system** with day-type and time-slot based rules
- **Multiple admin assignment** per turf
- **Image upload** with Cloudinary integration
- **Operating hours management**
- **Amenities and location tracking**
- **Automatic slug generation** for SEO-friendly URLs

### 📅 Booking System
- **Real-time availability checking**
- **Dynamic pricing calculation** based on time and day
- **Booking conflict prevention**
- **Status management** (pending, confirmed, cancelled)
- **Payment integration** with booking lifecycle

### 💳 Payment Processing
- **SSLCommerz integration** for secure payments
- **Webhook handling** for payment verification
- **Transaction tracking** with detailed logs
- **Payment status synchronization**
- **Email confirmations** for successful bookings

### 📊 Dashboard & Analytics
- **Role-specific dashboards** with relevant metrics
- **Revenue tracking** by day type and time slots
- **Booking statistics** and trends
- **User management** tools for managers

## 🛠️ Technology Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 5.1
- **Language:** TypeScript 5.0+
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod for schema validation
- **File Upload:** Multer + Cloudinary
- **Payment:** SSLCommerz
- **Email:** Nodemailer
- **Testing:** Vitest + Supertest
- **Code Quality:** ESLint + Prettier
- **Package Manager:** pnpm

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v7.0 or higher)
- pnpm (recommended) or npm
- Cloudinary account for image uploads
- SSLCommerz account for payments
- SMTP service for emails

## 🚀 Quick Start

### 1. Repository Access
```bash
# This is a private business repository
# Contact system administrators for access
cd turf-booking-system-backend
```

### 2. Install Dependencies
```bash
pnpm install
```

## 🔐 Business Configuration

### Production Environment Variables
```bash
# Business Server Configuration
PORT=9000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/khelbi_naki_prod
CLIENT_URL=https://app.khelbinakibd.com

# Security - Use strong production secrets
JWT_SECRET=your_production_jwt_secret_min_256_chars
JWT_REFRESH_SECRET=your_production_refresh_secret_min_256_chars
JWT_EXPIRES_IN=1h
REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUND=12

# SSLCommerz Business Account
SSL_STORE_ID=khelbi_naki_store_id
SSL_STORE_PASSWORD=your_sslcommerz_password
SSL_IS_LIVE=true

# Business Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@khelbinakibd.com
EMAIL_PASS=your_business_email_app_password
EMAIL_FROM="Khelbi Naki BD <no-reply@khelbinakibd.com>"

# Cloudinary Business Account
CLOUDINARY_CLOUD_NAME=khelbi_naki_cloud
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Business Manager Account
MANAGER_NAME=System Administrator
MANAGER_EMAIL=admin@khelbinakibd.com
MANAGER_PASSWORD=SecureAdminPassword2024!
```

### Development Environment Variables
```bash
# Development Configuration
PORT=9000
MONGODB_URI=mongodb://127.0.0.1:27017/khelbi_naki_dev
CLIENT_URL=http://localhost:5173

# Development JWT (Use simpler secrets for dev)
JWT_SECRET=dev_jwt_secret_key_for_local_development
JWT_REFRESH_SECRET=dev_refresh_secret_key_for_local
JWT_EXPIRES_IN=24h
REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUND=10

# SSLCommerz Sandbox
SSL_STORE_ID=testbox
SSL_STORE_PASSWORD=qwerty
SSL_IS_LIVE=false

# Development Email (Use Mailtrap or similar)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_password
EMAIL_FROM="Khelbi Naki Dev <dev@khelbinakibd.com>"

# Cloudinary Development
CLOUDINARY_CLOUD_NAME=dev_cloud
CLOUDINARY_API_KEY=dev_api_key
CLOUDINARY_API_SECRET=dev_secret

# Development Manager
MANAGER_NAME=Dev Admin
MANAGER_EMAIL=dev@khelbinakibd.com
MANAGER_PASSWORD=DevPassword123!
```

### 4. Start Development Server
```bash
# Install dependencies first
pnpm install

# Start development server with hot reload
pnpm dev

# For production
pnpm build && pnpm start
```

**Development Server:** `http://localhost:9000`
**Health Check:** `http://localhost:9000/api/v1/health`

### 5. Build for Production
```bash
pnpm build
pnpm start
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   └── env.ts       # Environment variables
├── controllers/      # Route controllers
│   ├── authController.ts
│   ├── bookingController.ts
│   ├── turfController.ts
│   ├── paymentController.ts
│   ├── userController.ts
│   └── adminController.ts
├── middlewares/      # Custom middleware
│   ├── authMiddleware.ts
│   ├── roleMiddleware.ts
│   └── errorHandler.ts
├── models/          # Mongoose schemas
│   ├── User.ts
│   ├── Turf.ts
│   ├── Booking.ts
│   ├── Payment.ts
│   └── Otp.ts
├── routes/          # Route definitions
│   ├── authRoutes.ts
│   ├── bookingRoutes.ts
│   ├── turfRoutes.ts
│   ├── paymentRoutes.ts
│   ├── userRoutes.ts
│   └── adminRoutes.ts
├── schemas/         # Zod validation schemas
│   ├── authSchema.ts
│   ├── bookingSchema.ts
│   ├── turfSchema.ts
│   └── userSchema.ts
├── services/        # Business logic
│   ├── bookingServices.ts
│   ├── turfServices.ts
│   ├── dashboardService.ts
│   ├── emailServices.ts
│   ├── turfPricingService.ts
│   ├── uploadService.ts
│   └── userServices.ts
├── utils/           # Utility functions
│   ├── AppError.ts
│   ├── asyncHandler.ts
│   ├── jwt.ts
│   ├── pagination.ts
│   └── sendEmail.ts
├── lib/             # External integrations
│   ├── db.ts        # Database connection
│   └── seeder.ts    # Database seeding
└── app.ts           # Express app configuration
```

## 🔗 API Endpoints

### Authentication
```
POST   /api/v1/auth/register          # User registration
POST   /api/v1/auth/verify-otp        # Email verification
POST   /api/v1/auth/login             # User login
POST   /api/v1/auth/refresh-token     # Token refresh
POST   /api/v1/auth/forgot-password   # Password reset request
PATCH  /api/v1/auth/reset-password/:token # Reset password
POST   /api/v1/auth/logout            # User logout
```

### Turfs
```
GET    /api/v1/turfs                  # Get all active turfs
GET    /api/v1/turfs/:slug            # Get turf details
GET    /api/v1/turfs/:id/availability # Check availability
POST   /api/v1/turfs                 # Create turf (Admin+)
PATCH  /api/v1/turfs/:id              # Update turf (Admin+)
DELETE /api/v1/turfs/:id              # Deactivate turf (Admin+)
```

### Bookings
```
POST   /api/v1/bookings              # Create booking
GET    /api/v1/bookings/my-bookings  # User's bookings
GET    /api/v1/bookings/:id          # Booking details
PATCH  /api/v1/bookings/:id/status   # Update status (Admin+)
```

### Payments
```
POST   /api/v1/payments/init/:bookingId    # Initialize payment
POST   /api/v1/payments/webhook            # SSLCommerz webhook
POST   /api/v1/payments/success/:transactionId  # Payment success
POST   /api/v1/payments/fail/:transactionId     # Payment failure
POST   /api/v1/payments/cancel/:transactionId   # Payment cancelled
```

### User Management
```
GET    /api/v1/users/me              # Get user profile
PATCH  /api/v1/users/me              # Update profile
```

### Admin & Manager
```
GET    /api/v1/admin/dashboard       # Dashboard statistics
GET    /api/v1/admin/users           # All users (Manager)
PATCH  /api/v1/admin/users/:id       # Update user (Manager)
PATCH  /api/v1/admin/turfs/:id/image # Upload turf image
```

## 🧪 Testing

### Run Tests
```bash
pnpm test
```

### Test Coverage
```bash
pnpm test --coverage
```

### Test Structure
- **Unit tests** for utilities and services
- **Integration tests** for API endpoints
- **Database tests** with isolated test environment

## 🔧 Configuration

### Database Seeding
The application automatically seeds:
- **Manager account** using environment variables
- **Sample turf data** for development

### Pricing System
Supports flexible pricing with:
- **Day-type rules** (sunday-thursday, friday-saturday, all-days)
- **Time-slot pricing** with custom rates
- **Default fallback pricing**

### File Uploads
- **Cloudinary integration** for image storage
- **Multer middleware** for file handling
- **Image optimization** and resizing

## 🚀 Business Deployment Guide

### Production Deployment Checklist

#### Database Setup
- [ ] MongoDB Atlas cluster configured
- [ ] Database indexes optimized for performance
- [ ] Backup strategy implemented
- [ ] Connection string secured

#### Security Configuration
- [ ] Strong JWT secrets (256+ characters)
- [ ] HTTPS certificates installed
- [ ] CORS properly configured for production domain
- [ ] Rate limiting implemented (if needed)
- [ ] Environment variables secured

#### Payment Gateway
- [ ] SSLCommerz live credentials configured
- [ ] Webhook URLs updated for production
- [ ] Payment flow tested thoroughly
- [ ] Transaction logging enabled

#### Email Service
- [ ] Business email account configured
- [ ] SMTP settings verified
- [ ] Email templates reviewed
- [ ] Delivery monitoring setup

#### File Storage
- [ ] Cloudinary production account setup
- [ ] Upload limits configured
- [ ] Image optimization settings applied
- [ ] Storage monitoring enabled

#### Monitoring & Logging
- [ ] Error tracking service integrated
- [ ] Performance monitoring setup
- [ ] API usage analytics configured
- [ ] Alert system for critical errors

### Environment-Specific Deployment

```bash
# Production Build
NODE_ENV=production pnpm build
NODE_ENV=production pnpm start

# Staging Build
NODE_ENV=staging pnpm build
NODE_ENV=staging pnpm start

# Health Check
curl https://api.khelbinakibd.com/api/v1/health
```

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example for containerization
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 9000
CMD ["pnpm", "start"]
```

## 🔒 Security Features

- **Password hashing** with bcrypt
- **JWT token encryption**
- **Rate limiting** (implement as needed)
- **Input validation** with Zod
- **SQL injection prevention** via Mongoose
- **XSS protection** through sanitization
- **CORS configuration**
- **Secure payment processing**

## 📝 API Documentation

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "meta": {
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1,
    "itemsPerPage": 10
  }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "path": ["field"],
      "message": "Validation error"
    }
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Update documentation as needed

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- **Zihad** - Backend Development
- **Faisal** - Backend Development

## 🆘 Support

For support, email support@khelbinakibd.com or create an issue in the repository.

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete authentication system
- Turf management
- Booking system
- Payment integration
- Admin dashboards

---

**Made with ❤️ for the football community in Bangladesh**
