/**
 * Simple Signature Training Script
 * Upload your signature images and train the ML model
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mediexpress';

// Doctor Schema (same as in your backend)
const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  specialty: { type: String, required: true },
  hospitalName: String,
  signaturePath: { type: String, required: true },
  signatureHash: String,
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Doctor = mongoose.model('Doctor', doctorSchema);

// Calculate perceptual hash (same algorithm as signature verification)
async function calculatePerceptualHash(imagePath) {
  try {
    const { data } = await sharp(imagePath)
      .resize(8, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = Array.from(data);
    const average = pixels.reduce((a, b) => a + b, 0) / pixels.length;

    let hash = '';
    for (const pixel of pixels) {
      hash += pixel > average ? '1' : '0';
    }

    return BigInt('0b' + hash).toString(16).padStart(16, '0');
  } catch (error) {
    console.error('❌ Error calculating hash:', error.message);
    return null;
  }
}

// Train a signature
async function trainSignature(signatureImagePath, doctorInfo) {
  try {
    console.log(`\n📸 Processing: ${path.basename(signatureImagePath)}`);
    
    // Check if file exists
    await fs.access(signatureImagePath);
    
    // Calculate signature hash
    const signatureHash = await calculatePerceptualHash(signatureImagePath);
    if (!signatureHash) {
      throw new Error('Failed to calculate signature hash');
    }
    
    console.log(`   Hash: ${signatureHash}`);
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads', 'signatures');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Copy signature to uploads folder
    const filename = `signature-${Date.now()}-${Math.floor(Math.random() * 1000000)}.png`;
    const destPath = path.join(uploadsDir, filename);
    
    // Convert to standard format and save
    await sharp(signatureImagePath)
      .resize(500, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(destPath);
    
    const relativePath = `uploads/signatures/${filename}`;
    
    // Save to database
    const doctor = new Doctor({
      name: doctorInfo.name,
      email: doctorInfo.email,
      phone: doctorInfo.phone,
      licenseNumber: doctorInfo.licenseNumber,
      specialty: doctorInfo.specialty,
      hospitalName: doctorInfo.hospitalName || '',
      signaturePath: relativePath,
      signatureHash: signatureHash,
      isVerified: true // Auto-verify during training
    });
    
    await doctor.save();
    
    console.log(`   ✅ Trained successfully!`);
    console.log(`   👨‍⚕️ Doctor: ${doctorInfo.name}`);
    console.log(`   📋 License: ${doctorInfo.licenseNumber}`);
    console.log(`   ✓ Status: Verified & Ready`);
    
    return doctor;
  } catch (error) {
    if (error.code === 11000) {
      console.log(`   ⚠️  Doctor already exists (duplicate email or license)`);
    } else {
      console.error(`   ❌ Error: ${error.message}`);
    }
    return null;
  }
}

// Main training function
async function trainModel() {
  console.log('\n🔬 ML Signature Training System');
  console.log('=' .repeat(60));
  
  try {
    // Connect to MongoDB
    console.log('\n📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Training data: Add your signature images here
    const trainingData = [
      {
        imagePath: 'C:/Users/Prakash Raj M/Desktop/Proto/swift-rx-pulse/training-data/signature1.png',
        doctorInfo: {
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@hospital.com',
          phone: '+91-9876543210',
          licenseNumber: 'MED123456',
          specialty: 'Cardiologist',
          hospitalName: 'Metro Hospital'
        }
      },
      {
        imagePath: 'C:/Users/Prakash Raj M/Desktop/Proto/swift-rx-pulse/training-data/signature2.png',
        doctorInfo: {
          name: 'Dr. Michael Chen',
          email: 'michael.chen@hospital.com',
          phone: '+91-9876543211',
          licenseNumber: 'MED123457',
          specialty: 'General Physician',
          hospitalName: 'City Medical Center'
        }
      },
      {
        imagePath: 'C:/Users/Prakash Raj M/Desktop/Proto/swift-rx-pulse/training-data/signature3.png',
        doctorInfo: {
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@hospital.com',
          phone: '+91-9876543212',
          licenseNumber: 'MED123458',
          specialty: 'Pediatrician',
          hospitalName: 'Children Hospital'
        }
      }
    ];
    
    console.log(`\n🎯 Training ${trainingData.length} signatures...\n`);
    
    let successCount = 0;
    for (const data of trainingData) {
      const result = await trainSignature(data.imagePath, data.doctorInfo);
      if (result) successCount++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n✨ Training Complete!`);
    console.log(`   ✅ Successfully trained: ${successCount}/${trainingData.length} signatures`);
    console.log(`\n📊 Model is now ready to verify prescriptions!`);
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Upload a prescription image using the test-prescription-ui.html`);
    console.log(`   2. The ML will automatically match the signature`);
    console.log(`   3. If confidence ≥ 85%, prescription will be auto-approved!`);
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Training failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

// Run the training
trainModel();
