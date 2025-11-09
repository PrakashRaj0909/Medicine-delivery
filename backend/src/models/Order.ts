import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  customerId: string;
  deliveryPartnerId?: string;
  items: Array<{
    medicineId: string;
    medicineName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: 'cod' | 'card' | 'upi';
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'accepted' | 'picked' | 'on_the_way' | 'delivered' | 'cancelled';
  prescription?: string; // URL to prescription image
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  customerNotes?: string;
  deliveryNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    deliveryPartnerId: {
      type: Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      index: true,
    },
    items: [
      {
        medicineId: { type: String, required: true },
        medicineName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'card', 'upi'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'accepted', 'picked', 'on_the_way', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    prescription: {
      type: String, // URL to uploaded prescription
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    customerNotes: {
      type: String,
    },
    deliveryNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

// Indexes for faster queries
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ deliveryPartnerId: 1, orderStatus: 1 });
OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ 'deliveryAddress.pincode': 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
