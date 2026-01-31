const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary with text overlay
 * @param {Buffer} fileBuffer - Image buffer
 * @param {Object} options - Upload options
 * @param {String} options.orderId - Order ID to overlay
 * @param {String} options.timestamp - Timestamp to overlay
 * @param {String} options.folder - Cloudinary folder
 * @param {String} options.deliveryPartnerName - Delivery partner name
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadWithOverlay = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const { orderId, timestamp, folder = 'delivery-proofs', deliveryPartnerName } = options;

        // Create text overlays
        const overlays = [];

        if (orderId) {
            overlays.push({
                overlay: {
                    font_family: 'Arial',
                    font_size: 40,
                    font_weight: 'bold',
                    text: `Order: ${orderId}`,
                },
                gravity: 'north_west',
                x: 20,
                y: 20,
                color: '#FFFFFF',
            });
        }

        if (timestamp) {
            overlays.push({
                overlay: {
                    font_family: 'Arial',
                    font_size: 30,
                    text: timestamp,
                },
                gravity: 'south_west',
                x: 20,
                y: 20,
                color: '#FFFFFF',
            });
        }

        if (deliveryPartnerName) {
            overlays.push({
                overlay: {
                    font_family: 'Arial',
                    font_size: 30,
                    text: `By: ${deliveryPartnerName}`,
                },
                gravity: 'south_east',
                x: 20,
                y: 20,
                color: '#FFFFFF',
            });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' },
                    ...overlays.map(o => ({
                        overlay: {
                            font_family: o.overlay.font_family,
                            font_size: o.overlay.font_size,
                            font_weight: o.overlay.font_weight,
                            text: o.overlay.text,
                        },
                        gravity: o.gravity,
                        x: o.x,
                        y: o.y,
                        color: o.color,
                    })),
                ],
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    reject(error);
                } else {
                    console.log('✅ Cloudinary upload successful:', result.secure_url);
                    resolve(result);
                }
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

/**
 * Upload delivery photo with overlays
 * @param {Buffer} fileBuffer - Image buffer
 * @param {String} orderId - Order ID
 * @param {String} deliveryPartnerName - Delivery partner name
 * @returns {Promise<Object>} Upload result with URL
 */
const uploadDeliveryPhoto = async (fileBuffer, orderId, deliveryPartnerName) => {
    const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const result = await uploadWithOverlay(fileBuffer, {
        orderId: orderId.slice(-8).toUpperCase(),
        timestamp,
        deliveryPartnerName,
        folder: 'delivery-proofs',
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
        timestamp,
        orderId,
    };
};

/**
 * Upload replacement photo
 * @param {Buffer} fileBuffer - Image buffer
 * @param {String} orderId - Order ID
 * @param {String} reason - Replacement reason
 * @returns {Promise<Object>} Upload result with URL
 */
const uploadReplacementPhoto = async (fileBuffer, orderId, reason) => {
    const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

    const result = await uploadWithOverlay(fileBuffer, {
        orderId: orderId.slice(-8).toUpperCase(),
        timestamp,
        folder: 'replacement-requests',
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
        timestamp,
        orderId,
        reason,
    };
};

/**
 * Upload KYC document
 * @param {Buffer} fileBuffer - Document buffer
 * @param {String} documentType - Type of document (aadhar, pan, license)
 * @param {String} partnerId - Delivery partner ID
 * @returns {Promise<Object>} Upload result with URL
 */
const uploadKYCDocument = async (fileBuffer, documentType, partnerId) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `kyc-documents/${partnerId}`,
                resource_type: 'image',
                public_id: `${documentType}_${Date.now()}`,
                transformation: [
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' },
                ],
            },
            (error, result) => {
                if (error) {
                    console.error('❌ KYC upload error:', error);
                    reject(error);
                } else {
                    console.log('✅ KYC upload successful:', result.secure_url);
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        documentType,
                    });
                }
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('✅ Image deleted from Cloudinary:', publicId);
        return result;
    } catch (error) {
        console.error('❌ Cloudinary deletion error:', error);
        throw error;
    }
};

module.exports = {
    uploadWithOverlay,
    uploadDeliveryPhoto,
    uploadReplacementPhoto,
    uploadKYCDocument,
    deleteImage,
    cloudinary,
};
