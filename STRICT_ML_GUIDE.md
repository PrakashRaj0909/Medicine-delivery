# 🔬 STRICT ML Model - Signature Verification System

## 🎯 How It Works

This ML model is configured in **STRICT MODE**:
- ✅ Only accepts prescriptions with signatures matching your **3 trained signatures**
- ❌ Rejects ALL other signatures (no manual review)
- 📊 Minimum confidence: **85%**
- 🎯 Uses advanced perceptual hashing (16x16) and pixel similarity

---

## 🚀 Quick Start Guide

### Step 1: Prepare Your 3 Signature Images

Place your 3 signature images in the `training-data/` folder:
- `signature1.png.png` (or replace with your image)
- `signature2.png.jpg` (or replace with your image)
- `signature3.png.jpg` (or replace with your image)

**Image Requirements:**
- Clear signature on white background
- Format: JPG, PNG
- Size: Any (will be auto-resized)
- Good contrast between signature and background

---

### Step 2: Train the Model

Run the training script:

```bash
cd backend
node train-model.js
```

**What happens:**
1. Clears any existing trained doctors
2. Processes your 3 signature images
3. Calculates unique fingerprints for each signature
4. Saves them to MongoDB as "verified doctors"
5. Model is now ready!

**Expected Output:**
```
🔬 STRICT ML Signature Training System
============================================================
📌 This will train the model with YOUR 3 signatures
📌 Only prescriptions with these signatures will be accepted
============================================================

📦 Connecting to MongoDB...
✅ Connected to MongoDB

🗑️  Clearing existing doctors...
   Deleted 1 existing doctor(s)

🎯 Training model with 3 signatures...

📸 Processing: signature1.png.png
   Hash: 3c3c3c3c3c3c3c3c
   ✅ Trained successfully!
   👨‍⚕️ Doctor: Dr. Sarah Johnson
   📋 License: MED001
   ✓ Status: Verified & Active

... (repeats for all 3 signatures)

✨ Training Complete!
   ✅ Successfully trained: 3/3 signatures

🎯 STRICT MODE ACTIVATED:
   ✓ Only these 3 signatures will be accepted
   ✓ Minimum confidence: 85%
   ✓ All other signatures will be REJECTED
```

---

### Step 3: Test the Model

1. **Start your backend server:**
```bash
cd backend
npm run dev
```

2. **Upload a prescription** with one of the trained signatures using your API endpoint:
```
POST http://localhost:3000/api/prescriptions/upload
```

3. **Watch the console output:**

**If signature MATCHES (85%+):**
```
============================================================
📋 Processing prescription RX1735483567890123
============================================================
✅ Model trained with 3 doctors
🔍 STRICT MODE: Comparing against 3 trained signatures...
📊 Acceptance threshold: 85% or higher
   → Comparing with: Dr. Sarah Johnson...
     Confidence: 92% ✅
   → Comparing with: Dr. Michael Chen...
     Confidence: 45% ❌
   → Comparing with: Dr. Priya Sharma...
     Confidence: 38% ❌

============================================================
📊 VERIFICATION RESULT: ✅ ACCEPTED
   Confidence: 92%
   Signature matched with 92% confidence (threshold: 85%)
============================================================
```

**If signature DOES NOT MATCH (<85%):**
```
============================================================
📋 Processing prescription RX1735483567890456
============================================================
✅ Model trained with 3 doctors
🔍 STRICT MODE: Comparing against 3 trained signatures...
📊 Acceptance threshold: 85% or higher
   → Comparing with: Dr. Sarah Johnson...
     Confidence: 34% ❌
   → Comparing with: Dr. Michael Chen...
     Confidence: 28% ❌
   → Comparing with: Dr. Priya Sharma...
     Confidence: 41% ❌

============================================================
📊 VERIFICATION RESULT: ❌ REJECTED
   Confidence: 41%
   Signature does not match any trained doctor. Best match: 41% (required: 85%+)
============================================================
```

---

## 🔧 How the Algorithm Works

### 1. **Perceptual Hashing (pHash)**
- Resizes signature to 16x16 pixels (256 bits)
- Converts to grayscale
- Calculates average brightness
- Creates binary fingerprint (1 if pixel > average, 0 otherwise)
- Converts to hexadecimal hash

### 2. **Hamming Distance**
- Compares two hashes bit-by-bit
- Counts number of different bits
- Lower distance = more similar signatures

**Scoring:**
- 0-10 bits different → 95-100% confidence
- 11-20 bits different → 85-94% confidence
- 21-30 bits different → 70-84% confidence
- 31+ bits different → <70% confidence (REJECTED)

### 3. **Pixel Similarity**
- Normalizes both signatures to 200x200 pixels
- Converts to grayscale and enhances contrast
- Calculates Mean Squared Error (MSE)
- Lower MSE = higher similarity

### 4. **Combined Score**
```
Final Confidence = (50% × pHash) + (50% × Pixel Similarity)
```

---

## 📊 API Response Examples

### ✅ Accepted Prescription
```json
{
  "message": "Prescription verified and accepted",
  "prescription": {
    "prescriptionId": "RX1735483567890123",
    "orderId": "ORD1735483567890",
    "validationStatus": "verified",
    "doctorName": "Dr. Sarah Johnson",
    "confidence": 92,
    "verified": true,
    "details": "Signature matched with 92% confidence (threshold: 85%)"
  }
}
```

### ❌ Rejected Prescription
```json
{
  "message": "Prescription rejected - signature does not match any trained doctor",
  "prescription": {
    "prescriptionId": "RX1735483567890456",
    "orderId": "ORD1735483567891",
    "validationStatus": "rejected",
    "doctorName": null,
    "confidence": 41,
    "verified": false,
    "details": "Signature does not match any trained doctor. Best match: 41% (required: 85%+)"
  }
}
```

---

## 🎨 Customization

### Change Acceptance Threshold

Edit `backend/src/services/signatureVerification.ts`:
```typescript
// Change this value (default: 85)
private readonly STRICT_MATCH_THRESHOLD = 90; // More strict (90%)
private readonly STRICT_MATCH_THRESHOLD = 80; // Less strict (80%)
```

### Change Required Number of Doctors

Edit `backend/src/services/signatureVerification.ts`:
```typescript
// Change this value (default: 3)
private readonly MINIMUM_DOCTORS_REQUIRED = 5; // Require 5 doctors
```

### Add More Training Images

Edit `backend/train-model.js` and add more entries to `trainingData` array:
```javascript
const trainingData = [
  // ... existing 3 signatures
  {
    imagePath: path.join(__dirname, '..', 'training-data', 'signature4.png'),
    doctorInfo: {
      name: 'Dr. New Doctor',
      email: 'newdoc@hospital.com',
      phone: '+91-9876543213',
      licenseNumber: 'MED004',
      specialty: 'Surgeon',
      hospitalName: 'New Hospital'
    }
  }
];
```

---

## 🔍 Testing Tips

### Test with Same Signature (Should ACCEPT)
1. Use one of the 3 images you trained with
2. Create a prescription with that signature at the bottom-right
3. Upload the prescription
4. Should get 85%+ confidence and be ACCEPTED

### Test with Different Signature (Should REJECT)
1. Use a completely different signature image
2. Create a prescription with that signature
3. Upload the prescription
4. Should get <85% confidence and be REJECTED

### Test Signature Placement
- Signature should be in the **bottom-right corner** of prescription
- The model extracts the bottom-right 30% width × 20% height region
- If signature is elsewhere, it may not be detected

---

## 📝 Summary

**Your ML model is now configured to:**
- ✅ Accept ONLY the 3 signatures you trained
- ✅ Require 85%+ confidence match
- ✅ Auto-reject anything else
- ✅ No manual review needed
- ✅ Strict fraud prevention

**To change trained signatures:**
1. Replace images in `training-data/`
2. Run `node train-model.js` again
3. Model will be retrained with new signatures!

---

## 🆘 Troubleshooting

**Issue:** "No trained doctors in system"
- **Solution:** Run `node train-model.js`

**Issue:** All prescriptions rejected
- **Solution:** Make sure prescription has one of the trained signatures in bottom-right corner

**Issue:** Low confidence scores
- **Solution:** Use high-quality, clear signature images for training

---

**Created:** January 2025  
**Mode:** STRICT  
**Algorithm:** Perceptual Hash (16x16) + Pixel Similarity (200x200)
