import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Customer, { ICustomer } from '../models/Customer.js';
import DeliveryPartner, { IDeliveryPartner } from '../models/DeliveryPartner.js';
import { generateToken } from '../utils/jwt.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const signupValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
  body('userType')
    .isIn(['customer', 'delivery_partner'])
    .withMessage('User type must be either customer or delivery_partner'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// @route   POST /api/auth/signup
// @desc    Register a new user (Customer or Delivery Partner)
// @access  Public
router.post('/signup', signupValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, phone, userType, address } = req.body;

    // Check if user already exists in both collections to prevent duplicates
    const existingCustomer = await Customer.findOne({ email });
    const existingPartner = await DeliveryPartner.findOne({ email });
    
    if (existingCustomer || existingPartner) {
      return res.status(400).json({ 
        error: 'An account already exists with this email' 
      });
    }

    // For delivery partners, check phone is provided
    if (userType === 'delivery_partner' && !phone) {
      return res.status(400).json({ error: 'Phone number is required for delivery partners' });
    }

    // Create new user in appropriate collection
    let user;
    if (userType === 'customer') {
      user = new Customer({
        email,
        password,
        name,
        phone,
        address,
      });
    } else {
      user = new DeliveryPartner({
        email,
        password,
        name,
        phone,
        approvalStatus: 'approved', // Auto-approve for testing, change to 'pending' in production
        isAvailable: true, // Set as available by default
        isOnline: true, // Set as online by default so they receive notifications
      });
    }

    await user.save();

    // Generate token
    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email,
      userType: userType,
    });

    res.status(201).json({
      message: `${userType === 'customer' ? 'Customer' : 'Delivery Partner'} created successfully`,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: userType,
        phone: user.phone,
        ...(userType === 'customer' && { address: (user as any).address }),
        ...(userType === 'delivery_partner' && { 
          approvalStatus: (user as any).approvalStatus,
          isAvailable: (user as any).isAvailable,
        }),
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (Customer or Delivery Partner)
// @access  Public
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Try to find user in both collections
    let user: (ICustomer | IDeliveryPartner) | null = null;
    let userType: 'customer' | 'delivery_partner' = 'customer';

    // First check in Customer collection
    user = await Customer.findOne({ email });
    if (user) {
      userType = 'customer';
    } else {
      // If not found, check in DeliveryPartner collection
      user = await DeliveryPartner.findOne({ email });
      if (user) {
        userType = 'delivery_partner';
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // For delivery partners, check approval status
    if (userType === 'delivery_partner') {
      const partner = user as IDeliveryPartner;
      if (partner.approvalStatus !== 'approved') {
        return res.status(403).json({ 
          error: 'Your account is pending approval. Please wait for admin verification.',
          approvalStatus: partner.approvalStatus,
        });
      }
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      userType: userType,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: userType,
        phone: user.phone,
        ...(userType === 'customer' && { address: (user as ICustomer).address }),
        ...(userType === 'delivery_partner' && { 
          approvalStatus: (user as IDeliveryPartner).approvalStatus,
          isAvailable: (user as IDeliveryPartner).isAvailable,
          isOnline: (user as IDeliveryPartner).isOnline,
          rating: (user as IDeliveryPartner).rating,
        }),
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.userType;
    
    let user;
    if (userType === 'customer') {
      user = await Customer.findById(req.user?.userId).select('-password');
    } else {
      user = await DeliveryPartner.findById(req.user?.userId).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: { ...user.toObject(), userType } });
  } catch (error: any) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.userType;
    
    let user;
    if (userType === 'customer') {
      user = await Customer.findById(req.user?.userId);
    } else {
      user = await DeliveryPartner.findById(req.user?.userId);
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, phone, address, vehicleType, vehicleNumber, bankDetails } = req.body;

    // Update common fields
    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Update customer-specific fields
    if (userType === 'customer' && address) {
      (user as ICustomer).address = address;
    }

    // Update delivery partner-specific fields
    if (userType === 'delivery_partner') {
      const partner = user as IDeliveryPartner;
      if (vehicleType) partner.vehicleType = vehicleType;
      if (vehicleNumber) partner.vehicleNumber = vehicleNumber;
      if (bankDetails) partner.bankDetails = bankDetails;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: userType,
        phone: user.phone,
        ...(userType === 'customer' && { address: (user as ICustomer).address }),
        ...(userType === 'delivery_partner' && { 
          vehicleType: (user as IDeliveryPartner).vehicleType,
          vehicleNumber: (user as IDeliveryPartner).vehicleNumber,
          isAvailable: (user as IDeliveryPartner).isAvailable,
        }),
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// @route   GET /api/auth/stats
// @desc    Get user statistics (for delivery partners: earnings, orders, etc.)
// @access  Private
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userType = req.user?.userType;
    
    if (userType === 'delivery_partner') {
      const partner = await DeliveryPartner.findById(req.user?.userId).select('earnings rating activeOrders completedOrders');
      
      if (!partner) {
        return res.status(404).json({ error: 'Delivery partner not found' });
      }

      res.json({
        earnings: partner.earnings,
        rating: partner.rating,
        activeOrdersCount: partner.activeOrders?.length || 0,
        completedOrdersCount: partner.completedOrders?.length || 0,
      });
    } else {
      const customer = await Customer.findById(req.user?.userId).select('orderHistory');
      
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json({
        totalOrders: customer.orderHistory?.length || 0,
      });
    }
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

export default router;
