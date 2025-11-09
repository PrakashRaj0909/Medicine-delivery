import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialty: string;
  hospitalName?: string;
  hospitalAddress?: string;
  signatureImage: string; // Path to signature image
  signatureHash: string; // Hash of signature for quick comparison
  isVerified: boolean;
  isActive: boolean;
  verificationDocuments?: {
    medicalLicense?: string;
    degreecertificate?: string;
    idProof?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
    },
    hospitalName: {
      type: String,
      trim: true,
    },
    hospitalAddress: {
      type: String,
      trim: true,
    },
    signatureImage: {
      type: String,
      required: true,
    },
    signatureHash: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationDocuments: {
      medicalLicense: { type: String },
      degreeCertificate: { type: String },
      idProof: { type: String },
    },
  },
  {
    timestamps: true,
    collection: 'doctors',
  }
);

// Indexes
DoctorSchema.index({ email: 1 });
DoctorSchema.index({ licenseNumber: 1 });
DoctorSchema.index({ isVerified: 1, isActive: 1 });

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
