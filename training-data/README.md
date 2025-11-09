# 🔬 ML Signature Training - Quick Guide

## 📁 How to Train Your Signatures

### Step 1: Add Your Signature Images

Put your signature images in this folder (`training-data/`) with these names:
- `signature1.png` - First doctor's signature
- `signature2.png` - Second doctor's signature  
- `signature3.png` - Third doctor's signature

**Or any names you want!** Just update the script accordingly.

### Step 2: Edit the Training Script

Open `backend/train-signatures.cjs` and update the `trainingData` array:

```javascript
const trainingData = [
  {
    imagePath: 'C:/Users/Prakash Raj M/Desktop/Proto/swift-rx-pulse/training-data/signature1.png',
    doctorInfo: {
      name: 'Dr. Your Name Here',
      email: 'doctor1@hospital.com',
      phone: '+91-9876543210',
      licenseNumber: 'MED001',
      specialty: 'Cardiologist',
      hospitalName: 'Your Hospital'
    }
  },
  // Add more signatures...
];
```

### Step 3: Run the Training Script

```bash
cd backend
node train-signatures.cjs
```

### Step 4: Test with Prescription

Upload a prescription that contains one of the trained signatures using:
- The HTML interface: `backend/test-prescription-ui.html`
- Or the API: `POST /api/prescriptions/upload`

The ML will automatically match the signature and verify the prescription! ✅

---

## 🎯 What Happens During Training?

1. **Reads your signature image**
2. **Calculates perceptual hash** (ML fingerprint)
3. **Stores in MongoDB** with doctor info
4. **Auto-verifies** the doctor (no manual step needed!)

## 🔍 How Verification Works

When you upload a prescription:
1. ML extracts signature from prescription
2. Compares with all trained signatures
3. If match ≥ 85% → **Auto-approved** ✅
4. If match 70-84% → **Manual review** ⚠️
5. If match < 70% → **Rejected** ❌

---

## 💡 Pro Tips

- Use **clear, high-quality** signature images
- **PNG or JPG** format works best
- Images will be auto-resized and normalized
- You can train **unlimited** signatures

---

**Ready to train? Add your signature images to this folder and run the script!** 🚀
