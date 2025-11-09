import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IDeliveryPartner extends Document {
  email: string;
  password: string;
  name: string;
  phone: string; // Required for delivery partners
  vehicleType?: 'bike' | 'scooter' | 'car' | 'bicycle';
  vehicleNumber?: string;
  licenseNumber?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  };
  isAvailable: boolean;
  isOnline: boolean;
  activeOrders?: string[]; // Array of currently assigned order IDs
  completedOrders?: string[]; // Array of completed order IDs
  rating?: {
    average: number;
    totalRatings: number;
  };
  earnings?: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  documents?: {
    aadharCard?: string;
    panCard?: string;
    drivingLicense?: string;
    vehicleRC?: string;
  };
  isVerified: boolean;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const DeliveryPartnerSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'car', 'bicycle'],
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      lastUpdated: { type: Date },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    activeOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    completedOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0 },
    },
    earnings: {
      today: { type: Number, default: 0 },
      thisWeek: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    bankDetails: {
      accountHolderName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String, uppercase: true },
      bankName: { type: String },
    },
    documents: {
      aadharCard: { type: String },
      panCard: { type: String },
      drivingLicense: { type: String },
      vehicleRC: { type: String },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    collection: 'delivery_partners', // Explicit collection name
  }
);

// Indexes for faster queries
DeliveryPartnerSchema.index({ email: 1 });
DeliveryPartnerSchema.index({ phone: 1 });
DeliveryPartnerSchema.index({ isActive: 1, isOnline: 1 });
DeliveryPartnerSchema.index({ isAvailable: 1, approvalStatus: 1 });
DeliveryPartnerSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

// Hash password before saving
DeliveryPartnerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
DeliveryPartnerSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IDeliveryPartner>('DeliveryPartner', DeliveryPartnerSchema);
