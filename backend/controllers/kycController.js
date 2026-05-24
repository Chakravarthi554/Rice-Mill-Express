const KycApplication = require('../models/KycApplication');
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { emitNewKyc } = require('../utils/socketServer');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

// Multer configuration (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'businessProof', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
]);

const syncKycToProfile = asyncHandler(async (req, res, next) => {
  const { businessName, businessType, gstNumber, panNumber, businessAddress } = req.body;
  const address = businessAddress ? JSON.parse(businessAddress) : { street: '', city: '', state: '', pinCode: '', country: 'India' };

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.businessDetails = {
    businessName: businessName || user.businessDetails?.businessName,
    businessType: businessType || user.businessDetails?.businessType,
    gstNumber: gstNumber || user.businessDetails?.gstNumber,
    panNumber: panNumber || user.businessDetails?.panNumber,
    address: address || user.businessDetails?.address,
  };

  await user.save();
  next();
});

const submitKycApplication = asyncHandler(async (req, res) => {
  try {
    console.log('submitKycApplication called for user:', req.user._id);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const files = {
      idProof: req.files['idProof'] ? req.files['idProof'][0] : null,
      addressProof: req.files['addressProof'] ? req.files['addressProof'][0] : null,
      businessProof: req.files['businessProof'] ? req.files['businessProof'][0] : null,
      gstCertificate: req.files['gstCertificate'] ? req.files['gstCertificate'][0] : null,
      panCard: req.files['panCard'] ? req.files['panCard'][0] : null,
    };

    // Check for required files
    const requiredFiles = ['idProof', 'addressProof'];
    const missingFiles = requiredFiles.filter(field => !files[field]);

    if (missingFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required files: ${missingFiles.join(', ')}`,
        details: `Please upload: ${missingFiles.map(f => f.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ')}`
      });
    }

    const { businessName, businessType, gstNumber, panNumber, businessAddress } = req.body;

    // Validate required fields
    if (!businessName || !businessType || !gstNumber || !panNumber) {
      return res.status(400).json({
        success: false,
        message: 'All business fields are required',
        required: ['businessName', 'businessType', 'gstNumber', 'panNumber']
      });
    }

    // Parse businessAddress
    let address = {};
    if (businessAddress) {
      try {
        address = typeof businessAddress === 'string' ? JSON.parse(businessAddress) : businessAddress;
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid business address format',
          details: 'Business address must be a valid JSON string'
        });
      }
    }

    // Process and save files
    const documents = [];
    const uploadDir = path.join(__dirname, '..', 'uploads');

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    for (const [type, file] of Object.entries(files)) {
      if (file) {
        const filename = `kyc-${Date.now()}-${req.user._id}-${type}${path.extname(file.originalname)}`;
        const documentUrl = `/uploads/${filename}`;
        const uploadPath = path.join(uploadDir, filename);

        try {
          fs.writeFileSync(uploadPath, file.buffer);
          console.log(`File saved to: ${uploadPath}`);

          documents.push({
            documentType: type,
            documentUrl,
            originalName: file.originalname,
            uploadedAt: new Date()
          });
        } catch (fileError) {
          console.error(`Error saving file ${filename}:`, fileError);
          // Clean up any already saved files
          documents.forEach((doc) => {
            const filePath = path.join(uploadDir, path.basename(doc.documentUrl));
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
              } catch (unlinkError) {
                console.error('Error cleaning up file:', unlinkError);
              }
            }
          });
          return res.status(500).json({
            success: false,
            message: 'Failed to save uploaded files',
            error: fileError.message
          });
        }
      }
    }

    const kycData = {
      user: req.user._id,
      businessName,
      businessType,
      gstNumber,
      panNumber,
      businessAddress: address,
      documents,
      status: 'under_review',
      submittedAt: new Date()
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('Creating KYC application with data:', kycData);
      const kycApplication = await KycApplication.create([kycData], { session });

      console.log('Updating user KYC status for:', req.user._id);
      await User.findByIdAndUpdate(
        req.user._id,
        { kycStatus: 'under_review' },
        { session }
      );

      await session.commitTransaction();
      console.log('KYC submission transaction committed successfully');
      session.endSession();

      // 🔥 ENHANCED: Create admin notifications for KYC
      const adminUsers = await mongoose.model('User').find({ role: 'admin' }).select('_id');
      if (adminUsers.length > 0) {
        const notificationPromises = adminUsers.map(admin =>
          Notification.create({
            user: admin._id,
            type: 'NEW_KYC_APPLICATION',
            title: 'New KYC Application',
            message: `New KYC application from ${businessName} (${req.user.name})`,
            priority: 'high',
            relatedEntity: kycApplication[0]._id,
            entityModel: 'KycApplication',
            actionUrl: `/admin/dashboard?tab=kyc&application=${kycApplication[0]._id}`,
            actionLabel: 'Review KYC'
          })
        );

        await Promise.all(notificationPromises);
      }

      // Enhanced socket emission
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to('admin_room').emit('NEW_KYC_SUBMITTED', {
          kycId: kycApplication[0]._id,
          userName: req.user.name,
          businessName: businessName,
          timestamp: new Date()
        });
      }

      res.status(201).json({
        success: true,
        message: 'KYC application submitted successfully',
        kycApplication: kycApplication[0],
        documentUrls: documents.map(d => d.documentUrl)
      });

    } catch (transactionError) {
      await session.abortTransaction();
      session.endSession();

      // Clean up uploaded files on transaction error
      documents.forEach((doc) => {
        const filePath = path.join(uploadDir, path.basename(doc.documentUrl));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (unlinkError) {
            console.error('Error cleaning up file:', unlinkError);
          }
        }
      });

      console.error('Transaction error in submitKycApplication:', transactionError);
      throw transactionError;
    }

  } catch (error) {
    console.error('Error in submitKycApplication:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'KYC validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during KYC submission',
      error: error.message
    });
  }
});

const approveKycApplication = asyncHandler(async (req, res) => {
  const kycId = req.params.id;
  const { reviewNotes } = req.body;

  const kyc = await KycApplication.findById(kycId);
  if (!kyc) return res.status(404).json({ message: 'KYC application not found' });

  kyc.status = 'approved';
  kyc.reviewNotes = reviewNotes || kyc.reviewNotes;
  await kyc.save();

  const updatedUser = await User.findByIdAndUpdate(
    kyc.user,
    { kycStatus: 'approved', role: 'seller' },
    { new: true, runValidators: true }
  );
  console.log('Admin action: Approved KYC for user:', updatedUser._id);

  await Notification.create({
    user: kyc.user,
    type: 'KYC_STATUS',
    message: 'Your KYC application has been approved.',
    relatedEntity: kyc._id,
  });

  // 📧 Send Email & SMS Notifications
  try {
    const emailSubject = 'KYC Approved - Welcome to Rice-Mill Express!';
    const msgBody = `<h2>Congratulations!</h2><p>Your KYC application for <b>${kyc.businessName}</b> has been <b>approved</b>.</p><p>You can now log in to the Seller Dashboard and start listing your products.</p><p>Review Notes: ${reviewNotes || 'Welcome aboard!'}</p>`;
    const smsMessage = `Congratulations! Your KYC for ${kyc.businessName} is approved. You can now log in to your seller account.`;

    await sendEmail({ email: updatedUser.email, subject: emailSubject, message: msgBody });
    if (updatedUser.phone) await sendSMS({ phone: updatedUser.phone, message: smsMessage });
  } catch (notifyErr) {
    console.error('⚠️ Notification failed during KYC approval:', notifyErr.message);
  }

  res.status(200).json({ success: true, message: 'KYC application approved', kyc, user: updatedUser });
});

const rejectKycApplication = asyncHandler(async (req, res) => {
  const kycId = req.params.id;
  const { reviewNotes } = req.body;

  const kyc = await KycApplication.findById(kycId);
  if (!kyc) return res.status(404).json({ message: 'KYC application not found' });

  if (!reviewNotes) return res.status(400).json({ message: 'Review notes are required for rejection' });

  kyc.status = 'rejected';
  kyc.reviewNotes = reviewNotes;
  await kyc.save();

  const updatedUser = await User.findByIdAndUpdate(
    kyc.user,
    { kycStatus: 'rejected' },
    { new: true, runValidators: true }
  );
  console.log('Admin action: Rejected KYC for user:', updatedUser._id);

  await Notification.create({
    user: kyc.user,
    type: 'KYC_STATUS',
    message: `Your KYC application has been rejected. Notes: ${reviewNotes}`,
    relatedEntity: kyc._id,
  });

  // 📧 Send Email & SMS Notifications
  try {
    const emailSubject = 'KYC Application Rejected';
    const msgBody = `<h2>KYC Update</h2><p>Your KYC application for <b>${kyc.businessName}</b> has been <b>rejected</b>.</p><p>Reason: ${reviewNotes}</p><p>Please update your documents and try again.</p>`;
    const smsMessage = `Your KYC for ${kyc.businessName} was rejected. Reason: ${reviewNotes}. Please re-submit correctly.`;

    await sendEmail({ email: updatedUser.email, subject: emailSubject, message: msgBody });
    if (updatedUser.phone) await sendSMS({ phone: updatedUser.phone, message: smsMessage });
  } catch (notifyErr) {
    console.error('⚠️ Notification failed during KYC rejection:', notifyErr.message);
  }

  res.status(200).json({ success: true, message: 'KYC application rejected', kyc, user: updatedUser });
});

const getKycApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;

  const applications = await KycApplication.find(query)
    .populate('user', 'name email phone role kycStatus')
    .sort('-submittedAt');

  console.log('Admin fetched KYC applications:', applications.length);
  res.json(applications);
});

const reviewKycApplication = asyncHandler(async (req, res) => {
  const { status, reviewNotes } = req.body;
  const { id } = req.params;

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Invalid review status. Must be "approved" or "rejected".');
  }
  if (status === 'rejected' && !reviewNotes) {
    res.status(400);
    throw new Error('Review notes are required for rejecting a KYC application.');
  }

  const application = await KycApplication.findById(id);
  if (!application) {
    res.status(404);
    throw new Error('KYC application not found');
  }

  if (!['not_submitted', 'under_review'].includes(application.status)) {
    res.status(400);
    throw new Error(`Cannot review an application with current status: ${application.status}`);
  }

  application.status = status;
  application.reviewNotes = reviewNotes;
  application.reviewedAt = Date.now();

  const updatedApplication = await application.save();

  const updatedUser = await User.findByIdAndUpdate(
    application.user,
    { kycStatus: status, role: status === 'approved' ? 'seller' : 'customer' },
    { new: true, select: '-password +kycStatus +active +isVerified +email +phone +name +role' }
  );

  await Notification.create({
    user: application.user,
    type: 'KYC_STATUS',
    message: `Your KYC application has been ${status}. Notes: ${reviewNotes || 'N/A'}`,
    relatedEntity: application._id,
    metadata: { kycApplicationId: application._id, newStatus: status, reviewNotes },
  });

  // 📧 Send Email & SMS Notifications
  try {
    const isApproved = status === 'approved';
    const emailSubject = isApproved ? 'KYC Approved - Welcome to Rice-Mill Express!' : 'KYC Application Rejected';
    const msgBody = isApproved
      ? `<h2>Congratulations!</h2><p>Your KYC application for <b>${application.businessName}</b> has been <b>approved</b>.</p><p>You can now log in to the Seller Dashboard and start listing your products.</p><p>Review Notes: ${reviewNotes || 'Welcome aboard!'}</p>`
      : `<h2>KYC Update</h2><p>Your KYC application for <b>${application.businessName}</b> has been <b>rejected</b>.</p><p>Reason: ${reviewNotes}</p><p>Please update your documents and try again.</p>`;

    const smsMessage = isApproved
      ? `Congratulations! Your KYC for ${application.businessName} is approved. You can now log in to your seller account.`
      : `Your KYC for ${application.businessName} was rejected. Reason: ${reviewNotes}. Please re-submit correctly.`;

    // Send Email
    await sendEmail({
      email: updatedUser.email,
      subject: emailSubject,
      message: msgBody
    });

    // Send SMS (if phone exists)
    if (updatedUser.phone) {
      await sendSMS({
        phone: updatedUser.phone,
        message: smsMessage
      });
    }
  } catch (notifyErr) {
    console.error('⚠️ Notification failed during KYC review:', notifyErr.message);
  }

  console.log('Admin reviewed KYC application:', updatedApplication._id, 'Status:', status);
  res.json({
    message: `KYC application ${status} successfully.`,
    kycApplication: updatedApplication,
    user: updatedUser,
  });
});

const getKycStatus = asyncHandler(async (req, res) => {
  console.log('getKycStatus called for user:', req.user._id);
  const userId = req.user._id;
  const user = await User.findById(userId).select('+kycStatus');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const application = await KycApplication.findOne({ user: userId }).sort({ submittedAt: -1 });
  if (application) {
    console.log('Returning application status:', application.status);
    res.json({ status: application.status, kycApplication: application });
  } else {
    console.log('No application found, returning user kycStatus:', user.kycStatus);
    res.json({ status: user.kycStatus, kycApplication: null });
  }
});

module.exports = {
  submitKycApplication,
  getKycApplications,
  reviewKycApplication,
  getKycStatus,
  approveKycApplication,
  rejectKycApplication,
  syncKycToProfile,
  uploadMiddleware: upload,
};