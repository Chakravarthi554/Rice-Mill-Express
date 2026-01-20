const { auth } = require('../config/firebase');
const asyncHandler = require('express-async-handler');

/**
 * Delivery Confirmation Service
 * Verifies Firebase ID tokens for delivery confirmation
 * 
 * IMPORTANT: This service does NOT handle OTP!
 * - OTP is sent by Firebase (frontend)
 * - OTP is verified by Firebase (frontend)
 * - This service only verifies the resulting ID token
 */
class DeliveryConfirmationService {

    /**
     * Verify Firebase ID token from delivery partner
     * @param {string} idToken - Firebase ID token (after OTP verification)
     * @returns {Promise<{verified: boolean, phoneNumber: string, uid: string}>}
     */
    async verifyToken(idToken) {
        try {
            // Verify the Firebase ID token
            const decodedToken = await auth.verifyIdToken(idToken);

            return {
                verified: true,
                phoneNumber: decodedToken.phone_number,
                uid: decodedToken.uid,
                email: decodedToken.email || null
            };
        } catch (error) {
            console.error('Verify ID token error:', error);
            throw new Error('Invalid or expired authentication token');
        }
    }

    /**
     * Create custom token for user (optional - for seamless login)
     * @param {string} uid - Firebase user UID
     * @returns {Promise<string>} Custom token
     */
    async createCustomToken(uid) {
        try {
            const customToken = await auth.createCustomToken(uid);
            return customToken;
        } catch (error) {
            console.error('Create custom token error:', error);
            throw error;
        }
    }
}

module.exports = new DeliveryConfirmationService();
