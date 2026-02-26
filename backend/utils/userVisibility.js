/**
 * User Visibility Utility
 * Handles anonymization of user profiles based on privacy settings.
 */

/**
 * Anonymizes a user object if their profile is set to private.
 * 
 * @param {Object} user - The user document/object to potentially anonymize (should be populated).
 * @param {Object} requester - The user making the request (req.user).
 * @returns {Object} - The original user data or an anonymized version.
 */
const anonymizeUser = (user, requester) => {
    if (!user) return null;

    // Convert to object if it's a Mongoose document
    const userData = user.toObject ? user.toObject() : user;

    // Admins always see the real data
    if (requester && requester.role === 'admin') {
        return userData;
    }

    // Check if the user has opted for a private profile
    // Supports both top-level field and nested privacySettings for robustness
    const isPublic = userData.isProfilePublic ?? userData.privacySettings?.profileVisible ?? true;

    if (isPublic) {
        return userData;
    }

    // Requester sees their own profile even if it's private
    if (requester && requester._id?.toString() === userData._id?.toString()) {
        return userData;
    }

    // Return anonymized structure
    return {
        _id: userData._id,
        name: 'Anonymous User',
        profileImage: '/uploads/default_avatar.jpg',
        profilePic: '/uploads/default_avatar.jpg', // Some controllers use profilePic
        businessName: 'Anonymous Seller',
        isAnonymous: true
    };
};

module.exports = {
    anonymizeUser
};
