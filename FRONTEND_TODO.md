# Turf Booking System Frontend Design Document
**Version:** 1.0
**Date:** August 31, 2025
**Made by:** Zihad and Faisal
**Based on:** Backend API Analysis

## 1. Introduction

### 1.1 Purpose
To design a modern, responsive, and high-performance frontend for the Turf Booking web application that seamlessly integrates with the existing backend API. This document outlines the complete frontend architecture, component structure, and implementation patterns for all user roles (User, Admin, Manager).

### 1.2 Scope
The frontend will be a single-page application (SPA) that provides:
- Public turf discovery and browsing with advanced search
- Complete authentication flow with OTP verification
- Dynamic booking system with real-time availability
- Integrated payment processing with SSLCommerz
- Role-based dashboards with comprehensive analytics
- Profile management and booking history
- Admin tools for turf and user management

## 2. Technology Stack & Architecture

### 2.1 Core Technologies
- **Framework:** React 18+ with TypeScript
- **UI Components:** Shadcn UI (copy-paste component system)
- **Styling:** Tailwind CSS with custom design tokens
- **Routing:** React Router v6 with protected routes
- **Server State:** TanStack Query (React Query) v4
- **Form Management:** React Hook Form with Zod validation
- **Build Tool:** Vite with hot module replacement
- **Development:** ESLint + Prettier with TypeScript strict mode

### 2.2 Architecture Principles
- **Component-driven development** with Atomic Design methodology
- **API-first approach** with comprehensive error handling
- **Mobile-first responsive design** across all breakpoints
- **Accessibility-first** with WCAG 2.1 AA compliance
- **Performance optimization** with code splitting and lazy loading

## 3. Project Structure

```
/src
├── /api                    # API client and endpoint definitions
│   ├── client.ts          # Axios instance with interceptors
│   ├── endpoints/         # API endpoint functions
│   │   ├── auth.ts        # Authentication endpoints
│   │   ├── bookings.ts    # Booking management
│   │   ├── turfs.ts       # Turf operations
│   │   ├── payments.ts    # Payment processing
│   │   └── admin.ts       # Admin operations
│   └── types/             # API response types
├── /assets                # Static assets
│   ├── /images           # Logos, placeholders, icons
│   ├── /fonts            # Custom fonts
│   └── /icons            # SVG icons
├── /components
│   ├── /ui               # Shadcn UI components
│   │   ├── button.tsx    # Base button component
│   │   ├── card.tsx      # Card layouts
│   │   ├── form.tsx      # Form primitives
│   │   ├── table.tsx     # Data tables
│   │   └── ...           # Other UI primitives
│   ├── /shared           # Reusable business components
│   │   ├── PageHeader.tsx
│   │   ├── SearchBar.tsx
│   │   ├── PriceDisplay.tsx
│   │   ├── StatusBadge.tsx
│   │   └── LoadingSpinner.tsx
│   └── /layout           # Layout components
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       ├── Footer.tsx
│       └── ProtectedRoute.tsx
├── /features             # Feature-specific components
│   ├── /auth
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── OTPVerification.tsx
│   │   └── ForgotPassword.tsx
│   ├── /turfs
│   │   ├── TurfCard.tsx
│   │   ├── TurfDetails.tsx
│   │   ├── TurfFilters.tsx
│   │   └── TurfSearch.tsx
│   ├── /booking
│   │   ├── BookingForm.tsx
│   │   ├── TimeSlotPicker.tsx
│   │   ├── BookingSummary.tsx
│   │   └── BookingHistory.tsx
│   ├── /payment
│   │   ├── PaymentSummary.tsx
│   │   └── PaymentStatus.tsx
│   └── /dashboard
│       ├── UserDashboard.tsx
│       ├── AdminDashboard.tsx
│       ├── ManagerDashboard.tsx
│       └── StatsCards.tsx
├── /hooks                # Custom React hooks
│   ├── useAuth.ts        # Authentication state
│   ├── useBooking.ts     # Booking operations
│   ├── useDebounce.ts    # Input debouncing
│   └── useLocalStorage.ts # Local storage management
├── /lib                  # Utilities and configurations
│   ├── utils.ts          # Helper functions
│   ├── constants.ts      # App constants
│   ├── validations.ts    # Zod schemas
│   └── date-utils.ts     # Date formatting utilities
├── /pages                # Route components
│   ├── Home.tsx
│   ├── TurfListing.tsx
│   ├── TurfDetails.tsx
│   ├── Booking.tsx
│   ├── Profile.tsx
│   └── /dashboard
│       ├── UserDashboard.tsx
│       ├── AdminDashboard.tsx
│       └── ManagerDashboard.tsx
├── /providers            # Context providers
│   ├── AuthProvider.tsx
│   ├── QueryProvider.tsx
│   └── ThemeProvider.tsx
├── /routes               # Route definitions
│   ├── AppRoutes.tsx
│   ├── ProtectedRoute.tsx
│   └── RoleBasedRoute.tsx
├── /stores               # Global state (Zustand)
│   ├── authStore.ts      # Authentication state
│   └── uiStore.ts        # UI state (theme, modals)
├── /types                # TypeScript type definitions
│   ├── api.ts            # API response types
│   ├── auth.ts           # Authentication types
│   └── booking.ts        # Booking-related types
├── App.tsx               # Root component
└── main.tsx              # Application entry
```

## 4. API Integration Strategy

### 4.1 API Client Configuration
```typescript
// api/client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshAuthToken()
      return apiClient.request(error.config)
    }
    return Promise.reject(error)
  }
)
```

### 4.2 TanStack Query Integration
- **Caching Strategy:** Aggressive caching for static data (turfs), shorter cache for dynamic data (availability)
- **Background Refetching:** Automatic updates for booking status and availability
- **Optimistic Updates:** Immediate UI updates with rollback on failure
- **Error Boundaries:** Global and feature-specific error handling

## 5. Route Structure & Navigation

### 5.1 Public Routes
```typescript
const publicRoutes = [
  { path: '/', element: <Home /> },
  { path: '/turfs', element: <TurfListing /> },
  { path: '/turfs/:slug', element: <TurfDetails /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/verify-otp', element: <OTPVerification /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password/:token', element: <ResetPassword /> },
];
```

### 5.2 Protected User Routes
```typescript
const userRoutes = [
  { path: '/profile', element: <Profile /> },
  { path: '/bookings', element: <BookingHistory /> },
  { path: '/bookings/:id', element: <BookingDetails /> },
  { path: '/booking-success', element: <BookingSuccess /> },
  { path: '/booking-failed', element: <BookingFailed /> },
  { path: '/booking-cancelled', element: <BookingCancelled /> },
];
```

### 5.3 Admin Routes
```typescript
const adminRoutes = [
  { path: '/admin/dashboard', element: <AdminDashboard /> },
  { path: '/admin/turfs', element: <AdminTurfManagement /> },
  { path: '/admin/turfs/:id/edit', element: <TurfEditor /> },
  { path: '/admin/bookings', element: <AdminBookingManagement /> },
];
```

### 5.4 Manager Routes
```typescript
const managerRoutes = [
  { path: '/manager/dashboard', element: <ManagerDashboard /> },
  { path: '/manager/turfs', element: <TurfManagement /> },
  { path: '/manager/users', element: <UserManagement /> },
  { path: '/manager/admins', element: <AdminManagement /> },
  { path: '/manager/bookings', element: <BookingManagement /> },
  { path: '/manager/analytics', element: <Analytics /> },
];
```

## 6. Authentication Implementation

### 6.1 Authentication Flow
1. **Registration:** Email/password → OTP verification → Auto-login
2. **Login:** Email/password validation → Token storage → Route redirect
3. **OTP Verification:** 6-digit code → Account activation → Token issuance
4. **Password Reset:** Email → Token link → New password → Auto-login
5. **Token Refresh:** Automatic refresh on 401 errors

### 6.2 Auth Context Structure
```typescript
interface AuthContext {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginData) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  verifyOTP: (email: string, otp: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}
```

### 6.3 Protected Route Implementation
- **Role-based access control** with redirect to appropriate dashboard
- **Permission checking** for admin/manager specific actions
- **Authentication state persistence** across browser sessions

## 7. Core Features Implementation

### 7.1 Turf Discovery & Search
**Components:**
- `TurfCard`: Display turf summary with image, price, amenities
- `TurfFilters`: Location, price range, amenities filtering
- `TurfSearch`: Real-time search with debounced API calls
- `TurfMap`: Interactive map view of turf locations

**Features:**
- Advanced filtering by location, price, amenities, availability
- Real-time search with autocomplete
- Pagination with infinite scroll option
- Responsive grid/list view toggle

### 7.2 Booking System
**Components:**
- `TimeSlotPicker`: Interactive time selection with pricing
- `BookingForm`: Date selection, time slots, player details
- `BookingSummary`: Price breakdown, terms confirmation
- `AvailabilityCalendar`: Month view with availability indicators

**Features:**
- Real-time availability checking
- Dynamic pricing based on time/day rules
- Booking conflict prevention
- Optimistic UI updates

### 7.3 Payment Integration
**Components:**
- `PaymentSummary`: Booking details and total cost
- `PaymentButton`: SSLCommerz integration button
- `PaymentStatus`: Success/failure/cancelled states

**Flow:**
1. Booking creation → Payment initialization
2. Redirect to SSLCommerz gateway
3. Payment completion → Webhook processing
4. Status update → Email confirmation

### 7.4 Dashboard Systems

**User Dashboard:**
- Upcoming bookings with quick actions
- Booking history with filtering/search
- Profile management
- Favorite turfs

**Admin Dashboard:**
- Assigned turf statistics
- Booking management for their turfs
- Revenue analytics by day type
- Turf image management

**Manager Dashboard:**
- Platform-wide statistics
- User and admin management
- System-wide booking oversight
- Financial analytics and reporting

## 8. State Management Strategy

### 8.1 Server State (TanStack Query)
```typescript
// Query keys for consistent caching
export const queryKeys = {
  turfs: ['turfs'] as const,
  turfDetails: (slug: string) => ['turfs', slug] as const,
  availability: (turfId: string, date: string) => ['availability', turfId, date] as const,
  bookings: ['bookings'] as const,
  userBookings: (userId: string) => ['bookings', 'user', userId] as const,
  dashboardStats: (role: string) => ['dashboard', role] as const,
}

// Custom hooks for data fetching
export function useTurfs(filters: TurfFilters) {
  return useQuery({
    queryKey: [...queryKeys.turfs, filters],
    queryFn: () => turfApi.getTurfs(filters),
    keepPreviousData: true,
  })
}
```

### 8.2 Client State (Zustand)
```typescript
// Authentication store
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (user: User, tokens: TokenPair) => void
  logout: () => void
}

// UI store for global UI state
interface UIStore {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  modals: { [key: string]: boolean }
  toggleTheme: () => void
  toggleSidebar: () => void
}
```

### 8.3 Form State (React Hook Form + Zod)
```typescript
// Booking form with real-time validation
const bookingSchema = z.object({
  turf: z.string(),
  date: z.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
})

function useBookingForm() {
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    mode: 'onChange',
  })

  return form
}
```

## 9. UI/UX Design System

### 9.1 Design Tokens
```typescript
// Tailwind configuration extensions
const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    success: { /* ... */ },
    warning: { /* ... */ },
    error: { /* ... */ },
  },
  fontFamily: {
    sans: ['Inter', 'system-ui'],
    display: ['Poppins', 'Inter'],
  },
  spacing: {
    18: '4.5rem',
    88: '22rem',
  },
}
```

### 9.2 Component Variants
- **Button:** primary, secondary, outline, ghost, destructive
- **Card:** default, elevated, outlined, interactive
- **Badge:** default, success, warning, error, info
- **Input:** default, error, success, disabled states

### 9.3 Responsive Breakpoints
- **Mobile:** 320px - 768px (focus on touch interactions)
- **Tablet:** 768px - 1024px (hybrid navigation)
- **Desktop:** 1024px+ (full feature access)

## 10. Performance Optimization

### 10.1 Code Splitting Strategy
```typescript
// Route-based code splitting
const Home = lazy(() => import('./pages/Home'))
const TurfListing = lazy(() => import('./pages/TurfListing'))
const AdminDashboard = lazy(() =>
  import('./pages/dashboard/AdminDashboard')
)

// Feature-based splitting for large components
const TurfDetails = lazy(() =>
  import('./features/turfs/TurfDetails')
)
```

### 10.2 Image Optimization
- **Lazy loading** for turf images with intersection observer
- **Responsive images** with multiple breakpoint sources
- **WebP format** with JPEG fallbacks
- **Placeholder blur** effects during loading

### 10.3 API Optimization
- **Request debouncing** for search inputs (300ms delay)
- **Prefetching** for likely navigation targets
- **Background refetching** for real-time data
- **Optimistic updates** for immediate feedback

## 11. Error Handling & Loading States

### 11.1 Error Boundaries
```typescript
// Global error boundary for unexpected errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>

// Feature-specific error boundaries
<ErrorBoundary fallback={<BookingErrorFallback />}>
  <BookingForm />
</ErrorBoundary>
```

### 11.2 Loading States
- **Skeleton screens** for content loading
- **Spinner components** for actions
- **Progressive disclosure** for form steps
- **Shimmer effects** for image loading

### 11.3 Network Error Handling
- **Retry mechanisms** with exponential backoff
- **Offline indicators** with service worker
- **Error toast notifications** for user feedback
- **Graceful degradation** for optional features

## 12. Security Implementation

### 12.1 Authentication Security
- **JWT storage** in httpOnly cookies (recommended) or secure localStorage
- **Token expiry handling** with automatic refresh
- **CSRF protection** with SameSite cookies
- **XSS prevention** with Content Security Policy

### 12.2 Route Protection
```typescript
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
```

### 12.3 Input Validation
- **Client-side validation** with Zod schemas
- **Sanitization** of user inputs
- **Rate limiting** simulation for form submissions
- **HTTPS enforcement** in production

## 13. Testing Strategy

### 13.1 Testing Pyramid
- **Unit Tests:** Utility functions, custom hooks (Vitest)
- **Component Tests:** UI components, forms (React Testing Library)
- **Integration Tests:** API integration, user flows (Playwright)
- **E2E Tests:** Critical user journeys (Playwright)

### 13.2 Testing Utilities
```typescript
// Custom render with providers
const renderWithProviders = (ui: ReactElement) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClient>
        <AuthProvider>
          <Router>{children}</Router>
        </AuthProvider>
      </QueryClient>
    ),
  });
};
```

## 14. Deployment & Environment Configuration

### 14.1 Environment Variables
```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_SSLCOMMERZ_STORE_ID: string
  readonly VITE_CLOUDINARY_CLOUD_NAME: string
}
```

### 14.2 Build Configuration
- **Production optimizations:** Tree shaking, minification, compression
- **Development tools:** Hot reload, error overlay, Redux DevTools
- **Environment-specific builds:** Staging, production configurations
- **CDN integration:** Asset optimization and delivery

## 15. Accessibility & Internationalization

### 15.1 Accessibility Features
- **Keyboard navigation** for all interactive elements
- **Screen reader support** with ARIA labels
- **Color contrast compliance** WCAG AA standard
- **Focus management** for single-page application
- **Alt text** for all images and icons

### 15.2 Responsive Design
- **Mobile-first approach** with progressive enhancement
- **Touch-friendly interfaces** with adequate tap targets
- **Flexible layouts** that work across all screen sizes
- **Print styles** for booking confirmations

## 16. Monitoring & Analytics

### 16.1 Error Monitoring
- **Runtime error tracking** with error boundaries
- **API error logging** with request/response details
- **Performance monitoring** with Core Web Vitals
- **User interaction tracking** for UX improvements

### 16.2 Analytics Integration
- **User journey tracking** through booking funnel
- **Feature usage analytics** for product decisions
- **Performance metrics** for optimization priorities
- **Conversion tracking** for business metrics

This comprehensive frontend design document provides a complete blueprint for implementing a modern, scalable, and user-friendly turf booking system that perfectly complements your robust backend architecture.
