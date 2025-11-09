/**
 * Test ML Model - Direct Comparison
 * This will test if your prescription signature matches the trained signatures
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculate perceptual hash
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

// Calculate pixel similarity
async function calculatePixelSimilarity(image1Path, image2Path) {
  try {
    const size = 200;
    
    const [data1, data2] = await Promise.all([
      sharp(image1Path)
        .resize(size, size, { fit: 'fill' })
        .greyscale()
        .normalise()
        .raw()
        .toBuffer(),
      sharp(image2Path)
        .resize(size, size, { fit: 'fill' })
        .greyscale()
        .normalise()
        .raw()
        .toBuffer(),
    ]);

    let totalDiff = 0;
    for (let i = 0; i < data1.length; i++) {
      const diff = data1[i] - data2[i];
      totalDiff += diff * diff;
    }

    const mse = totalDiff / data1.length;
    const maxMSE = 255 * 255;
    const similarity = Math.round((1 - Math.min(mse / maxMSE, 1)) * 100);

    return similarity;
  } catch (error) {
    console.error('Error:', error.message);
    return 0;
  }
}

async function testMLModel() {
  console.log('\n🧪 Testing ML Model - Direct Comparison\n');
  console.log('='.repeat(60));
  
  try {
    // Load trained signatures
    const trainedData = JSON.parse(
      await fs.readFile('trained-signatures.json', 'utf-8')
    );
    
    console.log(`\n📚 Loaded ${trainedData.length} trained signatures:`);
    trainedData.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.name} (${doc.licenseNumber})`);
    });
    
    // Your prescription
    const prescriptionPath = 'uploads/prescriptions/prescription-1761763762490-516452739.png';
    
    console.log(`\n📋 Testing prescription: ${prescriptionPath}`);
    
    // Check if prescription exists
    await fs.access(prescriptionPath);
    
    // Get prescription size
    const metadata = await sharp(prescriptionPath).metadata();
    console.log(`   Size: ${metadata.width}x${metadata.height}`);
    
    // Extract signature from prescription
    const width = metadata.width;
    const height = metadata.height;
    const extractWidth = Math.floor(width * 0.3);
    const extractHeight = Math.floor(height * 0.2);
    const left = width - extractWidth;
    const top = height - extractHeight;
    
    console.log(`   Extracting signature from: (${left}, ${top}) size: ${extractWidth}x${extractHeight}`);
    
    const extractedPath = 'test-extracted-sig.png';
    await sharp(prescriptionPath)
      .extract({ left, top, width: extractWidth, height: extractHeight })
      .toFile(extractedPath);
    
    // Preprocess extracted signature
    const processedPath = 'test-processed-sig.png';
    await sharp(extractedPath)
      .greyscale()
      .normalise()
      .threshold(128)
      .toFile(processedPath);
    
    console.log(`\n🔍 Comparing with trained signatures...\n`);
    
    // Compare with each trained signature
    for (const doctor of trainedData) {
      console.log(`\n━━━ ${doctor.name} ━━━`);
      
      // Calculate hashes
      const hash1 = await calculatePerceptualHash(doctor.signaturePath);
      const hash2 = await calculatePerceptualHash(processedPath);
      
      console.log(`   Trained hash:      ${hash1}`);
      console.log(`   Prescription hash: ${hash2}`);
      
      const distance = hammingDistance(hash1, hash2);
      console.log(`   Hamming distance: ${distance}`);
      
      // Calculate confidence from hash
      let hashConfidence = 0;
      if (distance <= 10) {
        hashConfidence = 100 - distance * 0.5;
      } else if (distance <= 20) {
        hashConfidence = 95 - (distance - 10) * 1;
      } else if (distance <= 30) {
        hashConfidence = 85 - (distance - 20) * 1.5;
      } else {
        hashConfidence = Math.max(0, 70 - (distance - 30) * 2);
      }
      
      // Calculate pixel similarity
      const pixelSim = await calculatePixelSimilarity(doctor.signaturePath, processedPath);
      
      // Combined confidence
      const finalConfidence = Math.round((hashConfidence * 0.5 + pixelSim * 0.5));
      
      console.log(`   Hash confidence:  ${hashConfidence.toFixed(1)}%`);
      console.log(`   Pixel similarity: ${pixelSim}%`);
      console.log(`   Final confidence: ${finalConfidence}%`);
      
      if (finalConfidence >= 85) {
        console.log(`   ✅ MATCH - Would be ACCEPTED`);
      } else if (finalConfidence >= 70) {
        console.log(`   ⚠️  PARTIAL - Manual review needed`);
      } else {
        console.log(`   ❌ NO MATCH - Would be REJECTED`);
      }
    }
    
    // Cleanup
    await fs.unlink(extractedPath);
    await fs.unlink(processedPath);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test Complete!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testMLModel();
