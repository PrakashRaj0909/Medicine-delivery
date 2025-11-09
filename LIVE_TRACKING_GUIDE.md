# Live Location Tracking - Testing Guide

## 🎯 Overview

The live location tracking system allows customers to track their delivery partner's real-time location once an order has been accepted. This guide explains how to test this feature.

## 📋 Prerequisites

1. **MongoDB Running**: Ensure MongoDB is running (local or Atlas)
2. **Backend Running**: `cd backend && npm run dev` (Port 3000)
3. **Frontend Running**: `cd frontend && npm run dev` (Port 5173)
4. **Location Services**: Enable location access in your browser

## 🔄 Complete Testing Flow

### Step 1: Create Customer Account

1. Go to `http://localhost:5173`
2. Click **"Order Medicines"** → Will redirect to `/customer-login`
3. Click **"Sign Up"** tab
4. Fill in:
   - Name: `Test Customer`
   - Email: `customer@test.com`
   - Phone: `9876543210`
   - Password: `password123`
   - Confirm Password: `password123`
5. Click **"Create Account"**
6. You'll be logged in and redirected to Dashboard

### Step 2: Place an Order

1. From Customer Dashboard, browse medicines
2. Click **"Add to Cart"** for some items (e.g., Paracetamol, Ibuprofen)
3. Click **"Cart"** button in header
4. Click **"Proceed to Checkout"**
5. Fill in delivery address:
   - Address Line 1: `123 Main Street`
   - City: `Mumbai`
   - State: `Maharashtra`
   - Pincode: `400001`
6. Select **"Cash on Delivery"**
7. Click **"Place Order"**
8. Order is now created in MongoDB with status: `pending`

### Step 3: Create Delivery Partner Account

1. **Open a new browser window/incognito tab** (to login as different user)
2. Go to `http://localhost:5173`
3. Click **"Join as Partner"** → Will redirect to `/delivery-login`
4. Click **"Sign Up"** tab
5. Fill in:
   - Name: `Test Delivery Partner`
   - Email: `delivery@test.com`
   - Phone: `9998887770`
   - Password: `password123`
   - Confirm Password: `password123`
6. Click **"Join as Partner"**
7. You'll be logged in and redirected to Delivery Dashboard

### Step 4: Accept the Order (This Triggers Location Tracking!)

1. In Delivery Partner Dashboard, you'll see the pending order
2. Click **"Accept Order"** button
3. **Browser will prompt for location permission** → Click **"Allow"**
4. ✅ Order status changes to `accepted`
5. ✅ Location tracking starts automatically in the background
6. ✅ GPS coordinates are sent to server every 10 seconds

### Step 5: Track Live Location (Customer View)

1. **Switch back to Customer browser window**
2. Click **"Orders"** from the header
3. You'll see your order with status **"ACCEPTED"**
4. Click **"Track Live"** button
5. **Live Tracking Dialog Opens!** You'll see:
   - ✅ Delivery Partner Name
   - ✅ Phone Number (clickable to call)
   - ✅ Vehicle Type & Number
   - ✅ Rating
   - ✅ **Live Location** with animated "LIVE" badge
   - ✅ GPS Coordinates
   - ✅ Embedded Google Map
   - ✅ Last Updated timestamp
   - ✅ Current Order Status

### Step 6: Watch Location Update in Real-Time

1. The location **updates automatically every 10 seconds**
2. As the delivery partner moves (or as you move your device), the location updates
3. The map marker moves to show current position
4. "Last updated" timestamp refreshes

### Step 7: Test Order Status Updates

**In Delivery Partner Dashboard:**

1. Click **"Mark as Picked"** → Status becomes `picked`
   - Customer can still track location
2. Click **"Start Delivery"** → Status becomes `on_the_way`
   - Customer can still track location
3. Click **"Mark as Delivered"** → Status becomes `delivered`
   - Location tracking stops
   - "Track Live" button disappears for customer

## 🔍 How to Verify It's Working

### Backend Verification

**Check MongoDB:**
```javascript
// In MongoDB Compass or Shell
use mediexpress

// Check order has delivery partner assigned
db.orders.find().pretty()
// Look for: deliveryPartnerId field is populated

// Check delivery partner location is being stored
db.delivery_partners.find().pretty()
// Look for: currentLocation object with latitude, longitude, lastUpdated
```

**Check Backend Console:**
```
Location updated for order ORD1234567890: 12.9716, 77.5946
```

### Frontend Verification

**Browser Console (Delivery Partner):**
```
Location updated for order ORD1234567890: 12.9716, 77.5946
```

**Browser DevTools Network Tab (Customer):**
- Every 10 seconds, see request to: `GET /api/orders/ORD.../delivery-location`
- Response shows current lat/lng

## 🧪 Testing Different Scenarios

### Scenario 1: Multiple Orders
1. Customer places multiple orders
2. Delivery partner can accept multiple orders
3. Location updates for all active orders simultaneously

### Scenario 2: No Location Permission
1. Delivery partner accepts order
2. Denies location permission
3. Error toast: "Please enable location services to accept orders"
4. Order remains unassigned

### Scenario 3: Order Not Assigned Yet
1. Customer views order with status `pending`
2. No "Track Live" button visible
3. Only appears after delivery partner accepts

### Scenario 4: Different Delivery Partners
1. Create 2 delivery partner accounts
2. Partner 1 accepts Order A
3. Partner 2 accepts Order B
4. Each customer only sees their assigned partner's location

## 🗺️ Simulating Movement (For Testing)

### Option 1: Use Browser DevTools
1. Open Chrome DevTools (F12)
2. Click **3 dots** → **More tools** → **Sensors**
3. In "Location" section, select a preset or enter custom lat/lng
4. Change coordinates to simulate movement

### Option 2: Use Physical Device
1. Access the app from your phone's browser
2. Walk around while location tracking is active
3. Watch the customer's map update in real-time

### Option 3: Browser Extensions
- Install **Location Guard** or **Manual Geolocation** extension
- Set custom coordinates
- Change periodically to test updates

## 📱 Mobile Testing

1. Deploy frontend and backend to a server (or use ngrok for local)
2. Access from actual mobile device
3. Delivery partner walks/drives while location tracking is on
4. Customer sees real-time movement on map

## 🐛 Troubleshooting

### "Order not found" Error
- **Cause**: Order only exists in localStorage, not MongoDB
- **Solution**: Place a new order after the API integration (Step 2 above)

### "No delivery partner assigned yet"
- **Cause**: Order status is still `pending`
- **Solution**: Delivery partner needs to accept the order first

### Location Not Updating
- **Check**: Browser location permission granted
- **Check**: Backend console for location update logs
- **Check**: Network tab shows requests every 10 seconds

### Map Not Loading
- **Check**: Internet connection (Google Maps needs internet)
- **Check**: Google Maps API key (currently using demo key)

## 🎉 Expected Behavior

✅ **When Delivery Partner Accepts Order:**
- Location permission prompt appears
- Browser starts tracking GPS
- Updates sent to server every 10 seconds
- Coordinates stored in MongoDB

✅ **When Customer Clicks "Track Live":**
- Dialog opens with live map
- Shows delivery partner details
- Map displays current location
- Auto-refreshes every 10 seconds
- "LIVE" badge animates

✅ **When Order Status Changes:**
- `pending` → No tracking available
- `accepted/picked/on_the_way` → Tracking available
- `delivered/cancelled` → Tracking stops

## 📊 Data Flow

```
1. Delivery Partner Accepts Order
   ↓
2. Browser Requests Location Permission
   ↓
3. navigator.geolocation.watchPosition() starts
   ↓
4. Every position change → POST to /api/orders/:id/location
   ↓
5. Backend updates DeliveryPartner.currentLocation in MongoDB
   ↓
6. Customer polls GET /api/orders/:id/delivery-location every 10s
   ↓
7. Backend returns current location from MongoDB
   ↓
8. Customer's map updates with new coordinates
```

## 🔐 Security Features

- ✅ Only customer who placed order can track
- ✅ Only assigned delivery partner can update location
- ✅ JWT authentication required for all endpoints
- ✅ Order ownership verified on every request

---

**Happy Testing! 🚀📍**