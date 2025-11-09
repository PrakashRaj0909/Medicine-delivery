/**
 * PURE ML Training Script (NO MONGODB)
 * Trains the model with ONLY 3 signature images from training-data folder
 * Stores signatures as JSON files locally
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local storage path for trained signatures
const SIGNATURES_DB_PATH = path.join(__dirname, 'trained-signatures.json');

// Calculate perceptual hash (16x16 for better accuracy)
async function calculatePerceptualHash(imagePath) {
  try {
    const { data } = await sharp(imagePath)
      .resize(16, 16, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = Array.from(data);
    const average = pixels.reduce((a, b) => a + b, 0) / pixels.length;

    let hash = '';
    for (const pixel of pixels) {
      hash += pixel > average ? '1' : '0';
    }

    return BigInt('0b' + hash).toString(16).padStart(64, '0');
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
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads', 'signatures');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Copy signature to uploads folder WITH PREPROCESSING
    const filename = `signature-${doctorInfo.licenseNumber}.png`;
    const destPath = path.join(uploadsDir, filename);
    
    // Preprocess and save signature (same as verification does)
    await sharp(signatureImagePath)
      .resize(500, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .greyscale()
      .normalise() // Enhance contrast
      .threshold(128) // Convert to black and white - SAME AS VERIFICATION
      .png()
      .toFile(destPath);
    
    const relativePath = `uploads/signatures/${filename}`;
    
    // Calculate signature hash AFTER preprocessing
    const signatureHash = await calculatePerceptualHash(destPath);
    if (!signatureHash) {
      throw new Error('Failed to calculate signature hash');
    }
    
    console.log(`   Hash: ${signatureHash}`);
    
    // Return doctor data
    return {
      id: doctorInfo.licenseNumber,
      name: doctorInfo.name,
      email: doctorInfo.email,
      phone: doctorInfo.phone,
      licenseNumber: doctorInfo.licenseNumber,
      specialty: doctorInfo.specialty,
      hospitalName: doctorInfo.hospitalName || '',
      signaturePath: relativePath,
      signatureHash: signatureHash,
      isVerified: true,
      isActive: true,
      trainedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// Save trained signatures to JSON file
async function saveTrainedSignatures(signatures) {
  await fs.writeFile(SIGNATURES_DB_PATH, JSON.stringify(signatures, null, 2));
  console.log(`\n💾 Saved ${signatures.length} signatures to ${SIGNATURES_DB_PATH}`);
}

// Main training function
async function trainModel() {
  console.log('\n🔬 PURE ML Signature Training System (NO MONGODB)');
  console.log('=' .repeat(60));
  console.log('📌 Training with YOUR 3 signatures ONLY');
  console.log('📌 Stored locally in JSON file');
  console.log('📌 No database required');
  console.log('=' .repeat(60));
  
  try {
    // Training data: YOUR 3 signature images
    const trainingData = [
      {
        imagePath: path.join(__dirname, '..', 'training-data', 'signature1.png'),
        doctorInfo: {
          name: 'Dr. Jack R. Frost',
          email: 'jack.frost@hospital.com',
          phone: '+91-9876543210',
          licenseNumber: 'MED001',
          specialty: 'General Physician',
          hospitalName: 'Frost Medical Center'
        }
      },
      {
        imagePath: path.join(__dirname, '..', 'training-data', 'signature2.png'),
        doctorInfo: {
          name: 'Dr. Michael Chen',
          email: 'michael.chen@hospital.com',
          phone: '+91-9876543211',
          licenseNumber: 'MED002',
          specialty: 'General Physician',
          hospitalName: 'City Medical Center'
        }
      },
      {
        imagePath: path.join(__dirname, '..', 'training-data', 'signature3.png'),
        doctorInfo: {
          name: 'Dr. Priya Sharma',
          email: 'priya.sharma@hospital.com',
          phone: '+91-9876543212',
          licenseNumber: 'MED003',
          specialty: 'Pediatrician',
          hospitalName: 'Children Hospital'
        }
      }
    ];
    
    console.log(`\n🎯 Training model with ${trainingData.length} signatures...\n`);
    
    const trainedSignatures = [];
    
    for (const data of trainingData) {
      const result = await trainSignature(data.imagePath, data.doctorInfo);
      if (result) {
        trainedSignatures.push(result);
        console.log(`   ✅ Trained successfully!`);
        console.log(`   👨‍⚕️ Doctor: ${result.name}`);
        console.log(`   📋 License: ${result.licenseNumber}`);
        console.log(`   ✓ Status: Verified & Active`);
      }
    }
    
    // Save to JSON file
    await saveTrainedSignatures(trainedSignatures);
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n✨ Training Complete!`);
    console.log(`   ✅ Successfully trained: ${trainedSignatures.length}/3 signatures`);
    console.log(`\n🎯 STRICT MODE ACTIVATED:`);
    console.log(`   ✓ ONLY these ${trainedSignatures.length} signatures will be accepted`);
    console.log(`   ✓ Minimum confidence: 85%`);
    console.log(`   ✓ ALL other signatures will be REJECTED`);
    console.log(`   ✓ No MongoDB - stored in: trained-signatures.json`);
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Start your backend: npm run dev`);
    console.log(`   2. Upload a prescription with one of these 3 signatures`);
    console.log(`   3. ONLY matching signatures will be accepted!`);
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Training failed:', error.message);
  }
}

// Run the training
trainModel();
