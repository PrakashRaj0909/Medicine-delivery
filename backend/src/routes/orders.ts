import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Customer from '../models/Customer.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import notificationService, { NotificationData } from '../services/notificationService.js';

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (Customer only)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.userType !== 'customer') {
      return res.status(403).json({ error: 'Only customers can create orders' });
    }

    const { items, totalAmount, deliveryAddress, paymentMethod, customerNotes } = req.body;

    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    console.log('\n🛒 NEW ORDER RECEIVED');
    console.log('Order ID:', orderId);
    console.log('Customer ID:', req.user.userId);
    console.log('Total Amount:', totalAmount);
    console.log('Items:', items.length);

    const order = new Order({
      orderId,
      customerId: req.user.userId,
      items,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed',
      orderStatus: 'pending',
      customerNotes,
      estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    });

    await order.save();
    console.log('✅ Order saved to database');

    // Add to customer's order history
    await Customer.findByIdAndUpdate(req.user.userId, {
      $push: { orderHistory: order._id },
    });

    // Get customer details for notifications
    const customer = await Customer.findById(req.user.userId);
    console.log('📧 Customer email:', customer?.email);

    // Prepare notification data
    const notificationData: NotificationData = {
      orderId: order.orderId,
      customerName: customer?.name || 'Customer',
      totalAmount: order.totalAmount,
      itemsCount: order.items.length,
      deliveryAddress: `${deliveryAddress.addressLine1}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`,
      orderDate: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };

    // Send order confirmation email to customer
    console.log('\n📬 Sending customer confirmation email...');
    if (customer?.email) {
      notificationService.sendOrderConfirmationEmail(
        customer.email,
        customer.name,
        notificationData
      ).then(() => {
        console.log('✅ Customer confirmation email sent successfully');
      }).catch(err => {
        console.error('❌ Failed to send customer confirmation:', err.message);
      });
    } else {
      console.log('⚠️  No customer email found, skipping customer email');
    }

    // Get all active delivery partners and notify them
    console.log('\n🔍 Looking for delivery partners...');
    const deliveryPartners = await DeliveryPartner.find({ 
      isAvailable: true,
      isOnline: true 
    }).select('name email phone');

    console.log(`Found ${deliveryPartners.length} available delivery partner(s)`);

    if (deliveryPartners.length > 0) {
      console.log('\n📧 Delivery Partners to notify:');
      deliveryPartners.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - ${p.email}`);
      });

      // Send notifications to delivery partners (async, don't wait)
      notificationService.notifyDeliveryPartners(
        deliveryPartners.map(p => ({
          name: p.name,
          email: p.email,
          phone: p.phone,
        })),
        notificationData
      ).then(() => {
        console.log('✅ Delivery partner notifications sent successfully\n');
      }).catch(err => {
        console.error('❌ Failed to notify delivery partners:', err.message);
      });
    } else {
      console.log('⚠️  No available delivery partners to notify');
      console.log('   Make sure delivery partners are registered with:');
      console.log('   - isAvailable: true');
      console.log('   - isOnline: true\n');
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order,
    });
  } catch (error: any) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// @route   GET /api/orders
// @desc    Get all orders for the authenticated user
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let orders;
    
    if (req.user?.userType === 'customer') {
      orders = await Order.find({ customerId: req.user.userId }).sort({ createdAt: -1 });
    } else {
      // Delivery partner: get unassigned orders + their assigned orders
      orders = await Order.find({
        $or: [
          { deliveryPartnerId: req.user?.userId },
          { deliveryPartnerId: null, orderStatus: 'pending' }
        ]
      }).sort({ createdAt: -1 });
    }

    res.json({ orders });
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// @route   GET /api/orders/:orderId
// @desc    Get order details by ID
// @access  Private
router.get('/:orderId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (req.user?.userType === 'customer' && order.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    if (req.user?.userType === 'delivery_partner' && 
        order.deliveryPartnerId && 
        order.deliveryPartnerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// @route   PUT /api/orders/:orderId/assign
// @desc    Assign order to delivery partner
// @access  Private (Delivery Partner only)
router.put('/:orderId/assign', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.userType !== 'delivery_partner') {
      return res.status(403).json({ error: 'Only delivery partners can accept orders' });
    }

    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.deliveryPartnerId) {
      return res.status(400).json({ error: 'Order already assigned to another delivery partner' });
    }

    order.deliveryPartnerId = req.user.userId as any;
    order.orderStatus = 'accepted';
    await order.save();

    // Add to delivery partner's active orders
    await DeliveryPartner.findByIdAndUpdate(req.user.userId, {
      $push: { activeOrders: order._id },
    });

    res.json({
      message: 'Order accepted successfully',
      order,
    });
  } catch (error: any) {
    console.error('Assign order error:', error);
    res.status(500).json({ error: 'Failed to assign order' });
  }
});

// @route   PUT /api/orders/:orderId/status
// @desc    Update order status
// @access  Private (Delivery Partner only)
router.put('/:orderId/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.userType !== 'delivery_partner') {
      return res.status(403).json({ error: 'Only delivery partners can update order status' });
    }

    const { status } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.deliveryPartnerId || order.deliveryPartnerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this order' });
    }

    order.orderStatus = status;

    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      // Move from active to completed
      await DeliveryPartner.findByIdAndUpdate(req.user.userId, {
        $pull: { activeOrders: order._id },
        $push: { completedOrders: order._id },
      });
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// @route   PUT /api/orders/:orderId/location
// @desc    Update delivery partner's location for an order
// @access  Private (Delivery Partner only)
router.put('/:orderId/location', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.userType !== 'delivery_partner') {
      return res.status(403).json({ error: 'Only delivery partners can update location' });
    }

    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.deliveryPartnerId || order.deliveryPartnerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this order' });
    }

    // Update delivery partner's current location
    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
      req.user.userId,
      {
        currentLocation: {
          latitude,
          longitude,
          lastUpdated: new Date(),
        },
        isOnline: true, // Mark as online when updating location
      },
      { new: true } // Return updated document
    );

    console.log(`✅ Location updated for delivery partner ${updatedPartner?.name} (Order: ${req.params.orderId}):`, 
      `${latitude}, ${longitude}`);

    res.json({
      message: 'Location updated successfully',
      location: { latitude, longitude, lastUpdated: new Date() },
    });
  } catch (error: any) {
    console.error('❌ Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// @route   GET /api/orders/:orderId/delivery-location
// @desc    Get delivery partner's current location for an order
// @access  Private (Customer only)
router.get('/:orderId/delivery-location', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      console.log(`❌ Order not found: ${req.params.orderId}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization - only the customer who placed the order can track
    if (req.user?.userType === 'customer' && order.customerId.toString() !== req.user.userId) {
      console.log(`❌ Unauthorized access attempt for order ${req.params.orderId}`);
      return res.status(403).json({ error: 'Not authorized to track this order' });
    }

    if (!order.deliveryPartnerId) {
      console.log(`⚠️ No delivery partner assigned to order ${req.params.orderId}`);
      return res.status(404).json({ error: 'No delivery partner assigned yet' });
    }

    // Get delivery partner details with location
    const deliveryPartner = await DeliveryPartner.findById(order.deliveryPartnerId).select(
      'name phone currentLocation vehicleType vehicleNumber rating isOnline'
    );

    if (!deliveryPartner) {
      console.log(`❌ Delivery partner not found for order ${req.params.orderId}`);
      return res.status(404).json({ error: 'Delivery partner not found' });
    }

    console.log(`📍 Fetching location for ${deliveryPartner.name} (Order: ${req.params.orderId}):`, 
      deliveryPartner.currentLocation ? 
      `${deliveryPartner.currentLocation.latitude}, ${deliveryPartner.currentLocation.longitude} (Updated: ${deliveryPartner.currentLocation.lastUpdated})` : 
      'No location data');

    res.json({
      deliveryPartner: {
        name: deliveryPartner.name,
        phone: deliveryPartner.phone,
        vehicleType: deliveryPartner.vehicleType,
        vehicleNumber: deliveryPartner.vehicleNumber,
        rating: deliveryPartner.rating,
        isOnline: deliveryPartner.isOnline,
      },
      location: deliveryPartner.currentLocation || null,
      orderStatus: order.orderStatus,
    });
  } catch (error: any) {
    console.error('❌ Get delivery location error:', error);
    res.status(500).json({ error: 'Failed to fetch delivery location' });
  }
});

export default router;
