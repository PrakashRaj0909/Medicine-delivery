import express, { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import Doctor from '../models/Doctor.js';
import Prescription from '../models/Prescription.js';
import signatureVerificationService from '../services/signatureVerification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Path to trained signatures JSON file (NO MONGODB)
const SIGNATURES_DB_PATH = path.join(__dirname, '..', '..', 'trained-signatures.json');

// Load trained signatures from local JSON file
async function loadTrainedSignatures() {
  try {
    const data = await fs.readFile(SIGNATURES_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('⚠️  No trained signatures found. Run: node train-model.js');
    return [];
  }
}

// Extend Request type to include file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

interface AuthMulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    if (file.fieldname === 'signature') {
      cb(null, 'uploads/signatures/');
    } else if (file.fieldname === 'prescription') {
      cb(null, 'uploads/prescriptions/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG) and PDF are allowed'));
    }
  },
});

// @route   POST /api/doctors/register
// @desc    Register a new doctor with signature
// @access  Public (should be admin-only in production)
router.post('/register', upload.single('signature'), async (req: MulterRequest, res: Response) => {
  try {
    const { name, email, phone, licenseNumber, specialty, hospitalName, hospitalAddress } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Signature image is required' });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({
      $or: [{ email }, { licenseNumber }],
    });

    if (existingDoctor) {
      return res.status(400).json({ error: 'Doctor with this email or license number already exists' });
    }

    // Calculate signature hash
    const signaturePath = req.file.path;
    const signatureHash = await signatureVerificationService.calculatePerceptualHash(signaturePath);

    // Create doctor
    const doctor = new Doctor({
      name,
      email,
      phone,
      licenseNumber,
      specialty,
      hospitalName,
      hospitalAddress,
      signatureImage: signaturePath,
      signatureHash,
      isVerified: false, // Admin should verify manually
    });

    await doctor.save();

    console.log(`✅ New doctor registered: ${name} (License: ${licenseNumber})`);

    res.status(201).json({
      message: 'Doctor registered successfully. Pending verification.',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        licenseNumber: doctor.licenseNumber,
        specialty: doctor.specialty,
        isVerified: doctor.isVerified,
      },
    });
  } catch (error: any) {
    console.error('Doctor registration error:', error);
    res.status(500).json({ error: 'Failed to register doctor' });
  }
});

// @route   GET /api/doctors
// @desc    Get all verified doctors
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const doctors = await Doctor.find({ isVerified: true, isActive: true }).select(
      'name email phone licenseNumber specialty hospitalName'
    );

    res.json({ doctors });
  } catch (error: any) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// @route   POST /api/prescriptions/upload
// @desc    Upload and validate prescription (PURE ML - uses local JSON file, NO MONGODB)
// @access  Private (Customer only)
router.post('/upload', authenticate, upload.single('prescription'), async (req: AuthMulterRequest, res: Response) => {
  try {
    if (req.user?.userType !== 'customer') {
      return res.status(403).json({ error: 'Only customers can upload prescriptions' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Prescription image is required' });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const prescriptionId = `RX${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const prescriptionPath = req.file.path;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Processing prescription ${prescriptionId} for order ${orderId}`);
    console.log(`📁 Using: trained-signatures.json (NO MONGODB)`);
    console.log(`${'='.repeat(60)}`);

    // Load trained signatures from local JSON file
    const trainedSignatures = await loadTrainedSignatures();

    if (trainedSignatures.length === 0) {
      return res.status(400).json({ 
        error: 'No trained signatures found. Please run: node train-model.js',
        trainingRequired: true
      });
    }

    // Show training status
    if (trainedSignatures.length < 3) {
      console.log(`⚠️  Warning: Only ${trainedSignatures.length}/3 signatures trained`);
    } else if (trainedSignatures.length === 3) {
      console.log(`✅ Model trained with 3 signatures from training-data folder`);
    } else {
      console.log(`📊 Model trained with ${trainedSignatures.length} signatures`);
    }

    const doctorData = trainedSignatures.map((doc: any) => ({
      id: doc.id,
      signaturePath: doc.signaturePath,
      signatureHash: doc.signatureHash,
      name: doc.name,
    }));

    // Verify signature using PURE ML
    const verificationResult = await signatureVerificationService.verifyPrescriptionSignature(
      prescriptionPath,
      doctorData
    );

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 VERIFICATION RESULT: ${verificationResult.verified ? '✅ ACCEPTED' : '❌ REJECTED'}`);
    console.log(`   Confidence: ${verificationResult.confidence}%`);
    console.log(`   ${verificationResult.details}`);
    console.log(`${'='.repeat(60)}\n`);

    // STRICT MODE: Only verified signatures are accepted (85%+ confidence)
    const validationStatus = verificationResult.verified ? 'verified' : 'rejected';

    res.status(201).json({
      message: verificationResult.verified 
        ? 'Prescription verified and accepted' 
        : 'Prescription rejected - signature does not match any trained signature',
      prescription: {
        prescriptionId: prescriptionId,
        orderId: orderId,
        validationStatus: validationStatus,
        doctorName: verificationResult.matchedDoctor?.name,
        confidence: verificationResult.confidence,
        verified: verificationResult.verified,
        details: verificationResult.details,
      },
    });
  } catch (error: any) {
    console.error('❌ Prescription upload error:', error);
    res.status(500).json({ error: 'Failed to process prescription' });
  }
});

// @route   GET /api/prescriptions/:orderId
// @desc    Get prescription by order ID
// @access  Private
router.get('/:orderId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prescription = await Prescription.findOne({ orderId: req.params.orderId }).populate(
      'doctorId',
      'name licenseNumber specialty'
    );

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Check authorization
    if (req.user?.userType === 'customer' && prescription.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view this prescription' });
    }

    res.json({ prescription });
  } catch (error: any) {
    console.error('Get prescription error:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// @route   PUT /api/prescriptions/:prescriptionId/review
// @desc    Manual review of prescription (Admin only)
// @access  Private (Admin only - add admin check in production)
router.put('/:prescriptionId/review', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const prescription = await Prescription.findOne({ prescriptionId: req.params.prescriptionId });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    prescription.validationStatus = status;
    prescription.verifiedBy = req.user?.userId || 'admin';
    prescription.verifiedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      prescription.validationResults = {
        ...prescription.validationResults,
        rejectionReason,
      } as any;
    }

    await prescription.save();

    console.log(`✅ Prescription ${prescription.prescriptionId} ${status} by ${req.user?.userId}`);

    res.json({
      message: `Prescription ${status} successfully`,
      prescription,
    });
  } catch (error: any) {
    console.error('Prescription review error:', error);
    res.status(500).json({ error: 'Failed to review prescription' });
  }
});

export default router;
