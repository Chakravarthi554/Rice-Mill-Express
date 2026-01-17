const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// File type validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
    };

    const allAllowedTypes = [...allowedTypes.image, ...allowedTypes.document, ...allowedTypes.video, ...allowedTypes.audio];

    if (allAllowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, documents, videos, and audio files are allowed.'), false);
    }
};

// Determine file type category
const getFileType = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'document';
};

// Memory storage for Cloudinary upload
const storage = multer.memoryStorage();

// File size limits
const limits = {
    fileSize: 50 * 1024 * 1024, // 50MB max
};

// Multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: limits
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, mimetype, originalname) => {
    return new Promise((resolve, reject) => {
        const fileType = getFileType(mimetype);
        const resourceType = fileType === 'document' ? 'raw' : fileType;

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `chat/${fileType}s`,
                resource_type: resourceType,
                transformation: fileType === 'image' ? [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto:good' }
                ] : undefined
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        const readableStream = Readable.from(buffer);
        readableStream.pipe(uploadStream);
    });
};

// Middleware for single file upload
const uploadSingle = async (req, res, next) => {
    upload.single('file')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
            return next();
        }

        try {
            const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, req.file.originalname);
            req.cloudinaryResult = result;
            next();
        } catch (error) {
            return res.status(500).json({ message: 'File upload failed', error: error.message });
        }
    });
};

// Middleware for multiple files (up to 5)
const uploadMultiple = async (req, res, next) => {
    upload.array('files', 5)(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ message: 'Too many files. Maximum is 5 files.' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return next();
        }

        try {
            const uploadPromises = req.files.map(file =>
                uploadToCloudinary(file.buffer, file.mimetype, file.originalname)
            );
            const results = await Promise.all(uploadPromises);
            req.cloudinaryResults = results;
            next();
        } catch (error) {
            return res.status(500).json({ message: 'File upload failed', error: error.message });
        }
    });
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    getFileType
};
