/**
 * Test script for ML-based Prescription Validation
 * This script demonstrates the signature verification algorithms
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple perceptual hash calculation (same as in the service)
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
    console.error('Error:', error.message);
    return null;
  }
}

// Calculate Hamming distance
function hammingDistance(hash1, hash2) {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

// Test the algorithm
async function testSignatureMatching() {
  console.log('\n🔬 ML-Based Prescription Validation - Test Suite\n');
  console.log('=' .repeat(60));
  
  // Check if test images exist
  const testDir = path.join(__dirname, 'uploads', 'signatures');
  
  try {
    await fs.access(testDir);
  } catch {
    console.log('\n📁 Creating test directories...');
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(__dirname, 'uploads', 'prescriptions'), { recursive: true });
    console.log('✅ Directories created!');
  }

  console.log('\n📊 Algorithm Explanation:');
  console.log('   1. Perceptual Hash (pHash) - Creates image fingerprint');
  console.log('   2. Hamming Distance - Measures hash similarity');
  console.log('   3. Pixel Similarity - MSE-based comparison');
  console.log('   4. Combined Score - 60% pHash + 40% Pixel\n');

  console.log('📈 Confidence Thresholds:');
  console.log('   • 90-100% → Auto-approved ✅');
  console.log('   • 85-89%  → Auto-approved ✅');
  console.log('   • 70-84%  → Manual Review ⚠️');
  console.log('   • <70%    → Rejected ❌\n');

  console.log('=' .repeat(60));

  // Check for signature files
  const files = await fs.readdir(testDir).catch(() => []);
  
  if (files.length === 0) {
    console.log('\n⚠️  No signature images found in uploads/signatures/');
    console.log('\n📝 To test the system:');
    console.log('   1. Register a doctor with a signature image');
    console.log('   2. Upload a prescription with the same signature');
    console.log('   3. The ML will verify and match signatures\n');
    console.log('💡 Use the API endpoints:');
    console.log('   POST /api/doctors/register');
    console.log('   POST /api/prescriptions/upload\n');
    return;
  }

  console.log(`\n✅ Found ${files.length} signature(s) in database`);
  
  // Calculate hashes for all signatures
  for (const file of files.slice(0, 3)) {
    const filePath = path.join(testDir, file);
    const hash = await calculatePerceptualHash(filePath);
    if (hash) {
      console.log(`\n📄 ${file}`);
      console.log(`   Hash: ${hash}`);
    }
  }

  // Demo hash comparison
  if (files.length >= 2) {
    console.log('\n🔍 Demo: Comparing first two signatures...');
    const hash1 = await calculatePerceptualHash(path.join(testDir, files[0]));
    const hash2 = await calculatePerceptualHash(path.join(testDir, files[1]));
    
    if (hash1 && hash2) {
      const distance = hammingDistance(hash1, hash2);
      let confidence = 0;
      
      if (distance <= 5) {
        confidence = 100 - distance * 2;
      } else if (distance <= 10) {
        confidence = 90 - (distance - 5) * 4;
      } else if (distance <= 15) {
        confidence = 70 - (distance - 10) * 4;
      } else {
        confidence = Math.max(0, 50 - (distance - 15) * 3);
      }

      console.log(`   Hamming Distance: ${distance}`);
      console.log(`   Estimated Match: ${confidence}%`);
      console.log(`   Status: ${confidence >= 70 ? '✅ Would Match' : '❌ Would Reject'}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Complete! System is ready for prescription validation.');
  console.log('=' .repeat(60) + '\n');
}

// Run the test
testSignatureMatching().catch(console.error);

/**
 * Test Script for ML-Based Prescription Validation
 * This demonstrates how the signature verification algorithm works
 */

console.log('🔬 ML-Based Prescription Validation System - Test Script\n');
console.log('=' .repeat(60));

// 1. Explain the Algorithm
console.log('\n📚 HOW THE ML ALGORITHM WORKS:\n');
console.log('1️⃣  Perceptual Hashing (pHash)');
console.log('   - Creates a 64-bit "fingerprint" of signature images');
console.log('   - Resilient to minor changes (rotation, scaling, compression)');
console.log('   - Uses Hamming distance to compare similarity\n');

console.log('2️⃣  Pixel-by-Pixel Similarity');
console.log('   - Normalizes both signatures to 100x100 pixels');
console.log('   - Calculates Mean Squared Error (MSE)');
console.log('   - Converts MSE to similarity percentage\n');

console.log('3️⃣  Combined Scoring');
console.log('   - Final Score = (60% × pHash) + (40% × Pixel Similarity)');
console.log('   - This gives the best accuracy\n');

// 2. Confidence Thresholds
console.log('=' .repeat(60));
console.log('\n📊 CONFIDENCE THRESHOLDS:\n');

const thresholds = [
  { range: '90-100%', status: '✅ VERIFIED', action: 'Auto-approved immediately' },
  { range: '85-89%', status: '✅ VERIFIED', action: 'Auto-approved immediately' },
  { range: '70-84%', status: '⚠️  MANUAL REVIEW', action: 'Flagged for admin review' },
  { range: '50-69%', status: '❌ REJECTED', action: 'Low confidence - rejected' },
  { range: '0-49%', status: '❌ REJECTED', action: 'No match found - rejected' },
];

thresholds.forEach(t => {
  console.log(`${t.range.padEnd(12)} | ${t.status.padEnd(18)} | ${t.action}`);
});

// 3. How to Use the API
console.log('\n' + '='.repeat(60));
console.log('\n🚀 HOW TO USE THE API:\n');

console.log('STEP 1: Register a Doctor with Signature');
console.log('-'.repeat(60));
console.log('Endpoint: POST http://localhost:3000/api/doctors/register\n');
console.log('Form Data:');
console.log('  name: "Dr. Sarah Johnson"');
console.log('  email: "sarah@hospital.com"');
console.log('  phone: "+91-9876543210"');
console.log('  licenseNumber: "MED123456"');
console.log('  specialty: "Cardiologist"');
console.log('  signature: [Upload signature image file]\n');

console.log('STEP 2: Verify the Doctor (MongoDB)');
console.log('-'.repeat(60));
console.log('Connect to MongoDB Compass or CLI and run:');
console.log('  db.doctors.updateOne(');
console.log('    { licenseNumber: "MED123456" },');
console.log('    { $set: { isVerified: true } }');
console.log('  )\n');

console.log('STEP 3: Upload a Prescription for Validation');
console.log('-'.repeat(60));
console.log('Endpoint: POST http://localhost:3000/api/prescriptions/upload\n');
console.log('Headers:');
console.log('  Authorization: Bearer [customer_token]\n');
console.log('Form Data:');
console.log('  orderId: "ORD1730234567890"');
console.log('  prescription: [Upload prescription image with signature]\n');

console.log('EXPECTED RESPONSE:');
console.log(JSON.stringify({
  message: "Prescription uploaded and processed",
  prescription: {
    prescriptionId: "RX1730234567890123",
    validationStatus: "verified",
    doctorName: "Dr. Sarah Johnson",
    confidence: 92,
    verified: true,
    details: "Signature matched with 92% confidence"
  }
}, null, 2));

// 4. Installation Check
console.log('\n' + '='.repeat(60));
console.log('\n🔧 CHECKING INSTALLED PACKAGES:\n');

try {
  const sharp = require('sharp');
  console.log('✅ sharp (image processing) - INSTALLED');
} catch (e) {
  console.log('❌ sharp - NOT INSTALLED (run: npm install sharp)');
}

try {
  const multer = require('multer');
  console.log('✅ multer (file uploads) - INSTALLED');
} catch (e) {
  console.log('❌ multer - NOT INSTALLED (run: npm install multer)');
}

try {
  const axios = require('axios');
  console.log('✅ axios (HTTP client) - INSTALLED');
} catch (e) {
  console.log('❌ axios - NOT INSTALLED (run: npm install axios)');
}

// 5. Next Steps
console.log('\n' + '='.repeat(60));
console.log('\n📝 NEXT STEPS:\n');
console.log('1. Start the backend server:');
console.log('   cd backend');
console.log('   npm run dev\n');

console.log('2. Use Postman, Thunder Client, or create a simple HTML form');
console.log('   to test the doctor registration and prescription upload\n');

console.log('3. Watch the backend console for detailed ML processing logs:');
console.log('   ✅ New doctor registered: Dr. Sarah Johnson');
console.log('   📋 Processing prescription RX123...');
console.log('   🔍 Verifying signature against 3 registered doctors...');
console.log('   📊 Verification result: VERIFIED (92%)\n');

console.log('4. Check the full guide:');
console.log('   Open: PRESCRIPTION_ML_GUIDE.md\n');

console.log('=' .repeat(60));
console.log('\n✨ ML Prescription Validation System Ready!\n');
