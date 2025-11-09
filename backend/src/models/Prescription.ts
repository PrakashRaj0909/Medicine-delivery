import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescription extends Document {
  prescriptionId: string;
  orderId: string;
  customerId: mongoose.Types.ObjectId;
  prescriptionImage: string;
  doctorId?: mongoose.Types.ObjectId;
  doctorName?: string;
  doctorLicenseNumber?: string;
  extractedText?: string;
  signatureMatchScore?: number;
  validationStatus: 'pending' | 'verified' | 'rejected' | 'manual_review';
  validationResults?: {
    signatureVerified: boolean;
    doctorVerified: boolean;
    textExtracted: boolean;
    matchConfidence: number;
    rejectionReason?: string;
  };
  verifiedBy?: string; // Admin/System user who verified
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema: Schema = new Schema(
  {
    prescriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    prescriptionImage: {
      type: String,
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    doctorName: {
      type: String,
    },
    doctorLicenseNumber: {
      type: String,
    },
    extractedText: {
      type: String,
    },
    signatureMatchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    validationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'manual_review'],
      default: 'pending',
    },
    validationResults: {
      signatureVerified: { type: Boolean },
      doctorVerified: { type: Boolean },
      textExtracted: { type: Boolean },
      matchConfidence: { type: Number },
      rejectionReason: { type: String },
    },
    verifiedBy: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'prescriptions',
  }
);

// Indexes
PrescriptionSchema.index({ prescriptionId: 1 });
PrescriptionSchema.index({ orderId: 1 });
PrescriptionSchema.index({ customerId: 1 });
PrescriptionSchema.index({ validationStatus: 1 });
PrescriptionSchema.index({ doctorId: 1 });

export default mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
