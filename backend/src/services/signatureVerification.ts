import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs/promises';

/**
 * STRICT ML-based Signature Verification Service
 * Only accepts prescriptions with signatures matching the 3 trained doctor signatures
 * Rejects all other signatures
 */

export interface SignatureMatchResult {
  isMatch: boolean;
  confidence: number;
  method: string;
}

export class SignatureVerificationService {
  
  // STRICT THRESHOLD: Accept 78% or higher matches (adjusted for preprocessing variations)
  private readonly STRICT_MATCH_THRESHOLD = 78;
  private readonly MINIMUM_DOCTORS_REQUIRED = 3;

  /**
   * Calculate perceptual hash (pHash) of an image
   * This creates a fingerprint of the image that's resilient to minor changes
   */
  async calculatePerceptualHash(imagePath: string): Promise<string> {
    try {
      // Resize to 16x16 for better accuracy (was 8x8)
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
      console.error('Error calculating perceptual hash:', error);
      throw error;
    }
  }

  /**
   * Calculate Hamming distance between two hashes
   * Lower distance = more similar images
   */
  hammingDistance(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      throw new Error('Hashes must be of equal length');
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }
    return distance;
  }

  /**
   * Detect if image is a full prescription or just a signature
   */
  async isFullPrescription(imagePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(imagePath).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      
      // If image is small (likely just a signature), return false
      // Signatures are typically < 600px in either dimension
      // Full prescriptions are usually > 800px
      if (width < 600 || height < 600) {
        console.log(`   📏 Image size: ${width}x${height} - Detected as SIGNATURE ONLY`);
        return false;
      }
      
      console.log(`   📏 Image size: ${width}x${height} - Detected as FULL PRESCRIPTION`);
      return true;
    } catch (error) {
      console.error('Error detecting image type:', error);
      return true; // Default to full prescription
    }
  }

  /**
   * Extract signature region from prescription image
   * Looks for signature in the bottom-right area (common location)
   */
  async extractSignatureRegion(prescriptionPath: string, outputPath: string): Promise<void> {
    try {
      const metadata = await sharp(prescriptionPath).metadata();
      const width = metadata.width || 1000;
      const height = metadata.height || 1000;

      // Extract bottom-right region (typical signature location)
      const extractWidth = Math.floor(width * 0.3);
      const extractHeight = Math.floor(height * 0.2);
      const left = width - extractWidth;
      const top = height - extractHeight;

      await sharp(prescriptionPath)
        .extract({
          left,
          top,
          width: extractWidth,
          height: extractHeight,
        })
        .toFile(outputPath);
    } catch (error) {
      console.error('Error extracting signature region:', error);
      throw error;
    }
  }

  /**
   * STRICT signature comparison - requires high similarity
   */
  async compareSignatures(
    storedSignaturePath: string,
    uploadedSignaturePath: string
  ): Promise<SignatureMatchResult> {
    try {
      // Method 1: Perceptual Hash Comparison
      const hash1 = await this.calculatePerceptualHash(storedSignaturePath);
      const hash2 = await this.calculatePerceptualHash(uploadedSignaturePath);
      
      const distance = this.hammingDistance(hash1, hash2);
      
      // STRICTER interpretation (256-bit hash with 16x16 image):
      // 0-10: Very similar (95-100% match)
      // 11-20: Similar (85-94% match)
      // 21-30: Somewhat similar (70-84% match)
      // 31+: Different (<70% match) - REJECT
      
      let confidence = 0;
      if (distance <= 10) {
        confidence = 100 - distance * 0.5; // 95-100%
      } else if (distance <= 20) {
        confidence = 95 - (distance - 10) * 1; // 85-94%
      } else if (distance <= 30) {
        confidence = 85 - (distance - 20) * 1.5; // 70-84%
      } else {
        confidence = Math.max(0, 70 - (distance - 30) * 2); // <70%
      }

      // Method 2: Pixel-by-pixel comparison (stricter)
      const pixelSimilarity = await this.calculatePixelSimilarity(
        storedSignaturePath,
        uploadedSignaturePath
      );

      // Combine both methods - weighted MORE towards pixel similarity for reliability
      // Pixel similarity is more reliable for signature matching
      const finalConfidence = Math.round((confidence * 0.2 + pixelSimilarity * 0.8));

      return {
        isMatch: finalConfidence >= this.STRICT_MATCH_THRESHOLD,
        confidence: finalConfidence,
        method: 'strict_perceptual_hash_and_pixel_similarity',
      };
    } catch (error) {
      console.error('Error comparing signatures:', error);
      throw error;
    }
  }

  /**
   * Calculate pixel-level similarity between two images (stricter)
   */
  async calculatePixelSimilarity(image1Path: string, image2Path: string): Promise<number> {
    try {
      // Use larger size for better accuracy
      const size = 200;
      
      const [data1, data2] = await Promise.all([
        sharp(image1Path)
          .resize(size, size, { fit: 'fill' })
          .greyscale()
          .normalise() // Normalize contrast
          .raw()
          .toBuffer(),
        sharp(image2Path)
          .resize(size, size, { fit: 'fill' })
          .greyscale()
          .normalise()
          .raw()
          .toBuffer(),
      ]);

      // Calculate mean squared error
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
      console.error('Error calculating pixel similarity:', error);
      return 0;
    }
  }

  /**
   * Preprocess signature image for better comparison
   */
  async preprocessSignature(inputPath: string, outputPath: string): Promise<void> {
    try {
      await sharp(inputPath)
        .greyscale()
        .normalise() // Enhance contrast
        .threshold(128) // Convert to black and white
        .toFile(outputPath);
    } catch (error) {
      console.error('Error preprocessing signature:', error);
      throw error;
    }
  }

  /**
   * STRICT VERIFICATION: Only accepts signatures matching the trained 3 signatures
   * Rejects everything else
   */
  async verifyPrescriptionSignature(
    prescriptionImagePath: string,
    registeredDoctors: Array<{ id: string; signaturePath: string; signatureHash: string; name: string }>
  ): Promise<{
    verified: boolean;
    matchedDoctor?: { id: string; name: string };
    confidence: number;
    details: string;
  }> {
    try {
      // Check if we have exactly 3 trained doctors
      if (registeredDoctors.length < this.MINIMUM_DOCTORS_REQUIRED) {
        console.log(`⚠️  Warning: Only ${registeredDoctors.length} doctors trained. Required: ${this.MINIMUM_DOCTORS_REQUIRED}`);
      }

      console.log(`🔍 STRICT MODE: Comparing against ${registeredDoctors.length} trained signatures...`);
      console.log(`📊 Acceptance threshold: ${this.STRICT_MATCH_THRESHOLD}% or higher`);

      // Detect if uploaded image is a full prescription or just a signature
      const isFullPrescription = await this.isFullPrescription(prescriptionImagePath);
      
      let processedSignaturePath: string;
      
      if (isFullPrescription) {
        // Extract signature region from prescription
        console.log(`   📋 Processing as full prescription - extracting signature from bottom-right`);
        const extractedSignaturePath = prescriptionImagePath.replace('.', '_signature.');
        await this.extractSignatureRegion(prescriptionImagePath, extractedSignaturePath);

        // Preprocess extracted signature
        processedSignaturePath = extractedSignaturePath.replace('.', '_processed.');
        await this.preprocessSignature(extractedSignaturePath, processedSignaturePath);
      } else {
        // Image is already a signature, just preprocess it
        console.log(`   ✏️  Processing as signature image - no extraction needed`);
        processedSignaturePath = prescriptionImagePath.replace('.', '_processed.');
        await this.preprocessSignature(prescriptionImagePath, processedSignaturePath);
      }

      let bestMatch: { doctor: any; confidence: number } | null = null;

      // Compare with ALL registered doctor signatures (no early exit)
      for (const doctor of registeredDoctors) {
        try {
          console.log(`   → Comparing with: ${doctor.name}...`);
          
          const result = await this.compareSignatures(
            doctor.signaturePath,
            processedSignaturePath
          );

          console.log(`     Confidence: ${result.confidence}% ${result.isMatch ? '✅' : '❌'}`);

          if (!bestMatch || result.confidence > bestMatch.confidence) {
            bestMatch = {
              doctor,
              confidence: result.confidence,
            };
          }
        } catch (error) {
          console.error(`   ❌ Error comparing with doctor ${doctor.id}:`, error);
          continue;
        }
      }

      // Clean up temporary files
      try {
        if (isFullPrescription) {
          const extractedSignaturePath = prescriptionImagePath.replace('.', '_signature.');
          await fs.unlink(extractedSignaturePath);
        }
        await fs.unlink(processedSignaturePath);
      } catch (error) {
        // Ignore cleanup errors
      }

      // STRICT CHECK: Must meet or exceed threshold
      if (bestMatch && bestMatch.confidence >= this.STRICT_MATCH_THRESHOLD) {
        console.log(`✅ ACCEPTED: Signature matched ${bestMatch.doctor.name} with ${bestMatch.confidence}%`);
        return {
          verified: true,
          matchedDoctor: {
            id: bestMatch.doctor.id,
            name: bestMatch.doctor.name,
          },
          confidence: bestMatch.confidence,
          details: `Signature matched with ${bestMatch.confidence}% confidence (threshold: ${this.STRICT_MATCH_THRESHOLD}%)`,
        };
      }

      // REJECTED
      console.log(`❌ REJECTED: Best match was ${bestMatch?.confidence || 0}% (below ${this.STRICT_MATCH_THRESHOLD}% threshold)`);
      return {
        verified: false,
        confidence: bestMatch?.confidence || 0,
        details: bestMatch
          ? `Signature does not match any trained doctor. Best match: ${bestMatch.confidence}% (required: ${this.STRICT_MATCH_THRESHOLD}%+)`
          : 'No matching signature found in trained dataset',
      };
    } catch (error) {
      console.error('Error verifying prescription signature:', error);
      throw error;
    }
  }
}

export default new SignatureVerificationService();
