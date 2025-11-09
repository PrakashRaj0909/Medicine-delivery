/**
 * Extract signature from uploaded prescription
 * This will extract the signature from the bottom-right corner
 * and save it as training data
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractSignature() {
  console.log('\n🔍 Extracting signature from prescription...\n');
  
  try {
    // Your uploaded prescription
    const prescriptionPath = path.join(__dirname, 'uploads', 'prescriptions', 'prescription-1761763762490-516452739.png');
    
    // Get image dimensions
    const metadata = await sharp(prescriptionPath).metadata();
    const width = metadata.width || 685;
    const height = metadata.height || 938;
    
    console.log(`📏 Prescription size: ${width}x${height}`);
    
    // Extract bottom-right region (30% width, 20% height)
    const extractWidth = Math.floor(width * 0.3);
    const extractHeight = Math.floor(height * 0.2);
    const left = width - extractWidth;
    const top = height - extractHeight;
    
    console.log(`✂️  Extracting region: ${extractWidth}x${extractHeight} from position (${left}, ${top})`);
    
    // Extract and save as signature1.png in training-data
    const outputPath = path.join(__dirname, '..', 'training-data', 'signature1.png');
    
    await sharp(prescriptionPath)
      .extract({
        left,
        top,
        width: extractWidth,
        height: extractHeight,
      })
      .resize(500, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Signature extracted and saved to: ${outputPath}`);
    console.log(`\n💡 Now run: node train-model.js`);
    console.log(`   This will train the model with the extracted signature\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

extractSignature();
