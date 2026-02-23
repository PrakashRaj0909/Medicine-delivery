# MediExpress Backend

Backend API server for the MediExpress medicine delivery platform.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)

## MongoDB Collections Structure

The backend uses **separate MongoDB collections** for different user types to ensure proper data isolation and role-based access control.

### Collections Overview

1. **`customers`** - Stores customer/patient data
2. **`delivery_partners`** - Stores delivery partner data
3. **`orders`** - Stores order information with references to both customers and delivery partners

### 1. Customers Collection

**Model**: `Customer.ts`

```typescript
{
  email: string (unique, indexed)
  password: string (hashed with bcrypt)
  name: string
  phone?: string
  address?: string
  deliveryAddresses?: [{
    label: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    isDefault: boolean
  }]
  orderHistory?: ObjectId[] (references to orders)
  isVerified: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Features**:
- Multiple delivery addresses support
- Order history tracking
- Email and phone indexing for fast lookups
- Password hashing with bcrypt

### 2. Delivery Partners Collection

**Model**: `DeliveryPartner.ts`

```typescript
{
  email: string (unique, indexed)
  password: string (hashed with bcrypt)
  name: string
  phone: string (required, indexed)
  vehicleType?: 'bike' | 'scooter' | 'car' | 'bicycle'
  vehicleNumber?: string
  licenseNumber?: string
  currentLocation?: {
    latitude: number
    longitude: number
    lastUpdated: Date
  }
  isAvailable: boolean
  isOnline: boolean
  activeOrders?: ObjectId[] (current deliveries)
  completedOrders?: ObjectId[] (delivery history)
  rating?: {
    average: number (0-5)
    totalRatings: number
  }
  earnings?: {
    today: number
    thisWeek: number
    thisMonth: number
    total: number
  }
  bankDetails?: {
    accountHolderName: string
    accountNumber: string
    ifscCode: string
    bankName: string
  }
  documents?: {
    aadharCard?: string
    panCard?: string
    drivingLicense?: string
    vehicleRC?: string
  }
  isVerified: boolean
  isActive: boolean
  approvalStatus: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
}
```

**Features**:
- Vehicle and license tracking
- Real-time location tracking
- Availability status management
- Earnings tracking (daily, weekly, monthly)
- Rating system
- Bank details for payouts
- Document management
- Approval workflow for onboarding

### 3. Orders Collection

**Model**: `Order.ts`

```typescript
{
  orderId: string (unique)
  customerId: ObjectId (reference to Customer)
  deliveryPartnerId?: ObjectId (reference to DeliveryPartner)
  items: [{
    medicineId: string
    medicineName: string
    quantity: number
    price: number
  }]
  totalAmount: number
  deliveryAddress: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
  }
  paymentMethod: 'cod' | 'card' | 'upi'
  paymentStatus: 'pending' | 'completed' | 'failed'
  orderStatus: 'pending' | 'accepted' | 'picked' | 'on_the_way' | 'delivered' | 'cancelled'
  prescription?: string (URL)
  estimatedDeliveryTime?: Date
  actualDeliveryTime?: Date
  customerNotes?: string
  deliveryNotes?: string
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**:
- `customerId` + `createdAt` (for customer order history)
- `deliveryPartnerId` + `orderStatus` (for partner active orders)
- `orderStatus` + `createdAt` (for order management)
- `deliveryAddress.pincode` (for location-based queries)

## Data Separation & Security

### User Type Isolation

1. **Signup**:
   - Based on `userType` parameter (`customer` or `delivery_partner`)
   - Creates user in appropriate collection
   - Prevents duplicate emails across both collections

2. **Login**:
   - Searches both collections to find the user
   - Returns user type in JWT token
   - Validates delivery partner approval status

3. **API Access**:
   - JWT contains `userType` field
   - Routes check user type and query appropriate collection
   - Customers cannot access delivery partner data and vice versa

### Benefits of Separate Collections

✅ **Clear Data Separation** - Customer and partner data never mix  
✅ **Role-Specific Fields** - Each collection has relevant fields only  
✅ **Better Performance** - Smaller collections, faster queries  
✅ **Easier Scaling** - Can shard or replicate collections independently  
✅ **Security** - Natural data isolation prevents cross-role access  
✅ **Maintainability** - Clear schema for each user type  

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Installation

```bash
# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the backend directory:

```env
# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# MongoDB
MONGODB_URI=mongodb://localhost:27017/mediexpress
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mediexpress

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

### Running Locally

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The server will start on http://localhost:3000

## Deployment (Render)

Render runs the install step and then the start command. This project uses a `postinstall` hook to compile TypeScript into `dist/`.

**Render settings**

- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment variables**

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mediexpress?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new customer or delivery partner
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "phone": "+91 9876543210",
    "userType": "customer" // or "delivery_partner"
  }
  ```

- `POST /api/auth/login` - Login (auto-detects user type)
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `GET /api/auth/profile` - Get current user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)
- `GET /api/auth/stats` - Get user statistics (requires auth)

### Health Check

- `GET /health` - Server health status
- `GET /api` - API information

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Main server file
│   ├── config/
│   │   └── database.ts       # MongoDB connection
│   ├── models/
│   │   ├── Customer.ts       # Customer schema & model
│   │   ├── DeliveryPartner.ts # Delivery partner schema & model
│   │   ├── Order.ts          # Order schema & model
│   │   └── User.ts           # (Legacy - can be removed)
│   ├── routes/
│   │   └── auth.ts           # Authentication routes
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication middleware
│   └── utils/
│       └── jwt.ts            # JWT helper functions
└── package.json
```

## MongoDB Setup

### Local MongoDB

```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Whitelist your IP address
4. Get connection string
5. Update `MONGODB_URI` in `.env`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

## Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT authentication with expiration
- ✅ Email validation
- ✅ User type validation
- ✅ Approval workflow for delivery partners
- ✅ Account activation/deactivation
- ✅ Protected routes with authentication middleware
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Request compression

## Development Notes

- Auto-approval for delivery partners is enabled for testing
- Change `approvalStatus: 'approved'` to `'pending'` in production
- Implement admin panel for partner approval workflow
- Add rate limiting for production
- Implement email verification
- Add phone OTP verification
