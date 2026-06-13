const { db } = require('../config/firebase');

/**
 * Firebase User Sync Service
 * Syncs MongoDB users to Firestore for Firebase rules to work
 */
class FirebaseUserSync {
    constructor() {
        this.isFirestoreWorking = true;
    }

    /**
     * Sync MongoDB user to Firestore
     * Call this after signup/login
     * @param {Object} user - MongoDB user object
     * @param {number} retryCount - Current retry attempt (internal use)
     */
    async syncUser(user, retryCount = 0) {
        const MAX_RETRIES = 3;

        if (this.isFirestoreWorking === false) {
            return false;
        }

        try {
        // ✅ Guard: Skip sync if Firebase Admin failed to init
        const { isFirebaseInitialized } = require('../config/firebase');
        if (!isFirebaseInitialized) {
          console.warn('⚠️ Firebase not initialized; skipping Firestore sync');
          return false;
        }
            // ✅ Validation: Ensure user has required fields
            if (!user || !user._id) {
                console.error('❌ Firestore sync: Invalid user object - missing _id');
                return false;
            }

            // ✅ FIX: Use Firebase UID as the document key if available
            // This aligns with frontend AuthContext which looks up by auth.currentUser.uid
            const docId = user.firebaseUid || user._id.toString();

            if (!docId) {
                console.error('❌ Firestore sync: No valid document ID (firebaseUid or _id)');
                return false;
            }

            const userRef = db.collection('users').doc(docId);

            // Convert to object if it's a Mongoose document to avoid prototype serialization issues
            const userObj = typeof user.toObject === 'function' ? user.toObject() : JSON.parse(JSON.stringify(user));

            // ✅ Validation: Ensure email or phone exists
            if (!userObj.email && !userObj.phone) {
                console.warn('⚠️ Firestore sync: User has neither email nor phone:', docId);
            }

            const userData = {
                uid: user.firebaseUid || user._id.toString(), // Store consistent UID
                mongoId: user._id.toString(), // Keep ref to mongo ID
                email: userObj.email || null,
                name: userObj.name || 'User',
                role: userObj.role || 'customer',
                phone: userObj.phone || null,
                profileImage: userObj.profileImage || null,
                businessDetails: userObj.businessDetails || null,
                isOnline: true,
                lastActive: new Date(),
                updatedAt: new Date()
            };

            await userRef.set(userData, { merge: true });

            console.log(`✅ User ${userObj.email || userObj.phone || docId} synced to Firestore (Doc ID: ${docId})`);
            return true;
        } catch (error) {
            console.error(`❌ Firestore sync error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);

            // ✅ Gracefully disable sync if credentials are unauthorized
            if (error.message.includes('UNAUTHENTICATED') || error.code === 16 || error.status === 16) {
                console.error('🛑 Firestore authentication failed (invalid credentials). Disabling further Firestore syncs to avoid logs noise.');
                this.isFirestoreWorking = false;
                return false;
            }

            // ✅ Retry logic: Retry up to MAX_RETRIES times
            if (retryCount < MAX_RETRIES - 1) {
                console.log(`🔄 Retrying Firestore sync in 1 second...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.syncUser(user, retryCount + 1);
            }

            // Don't throw - sync failure shouldn't block login
            console.error('❌ Firestore sync failed after max retries');
            return false;
        }
    }

    /**
     * Update user online status
     * @param {string} userId - MongoDB user ID
     * @param {boolean} isOnline - Online status
     */
    async updateOnlineStatus(userId, isOnline) {
        try {
            await db.collection('users').doc(userId.toString()).update({
                isOnline,
                lastActive: new Date()
            });
            console.log(`✅ User ${userId} online status: ${isOnline}`);
        } catch (error) {
            console.error('Update online status error:', error.message);
        }
    }

    /**
     * Update user role in Firestore
     * @param {string} userId - MongoDB user ID
     * @param {string} newRole - New role
     */
    async updateUserRole(userId, newRole) {
        try {
            await db.collection('users').doc(userId.toString()).update({
                role: newRole,
                updatedAt: new Date()
            });
            console.log(`✅ User ${userId} role updated to: ${newRole}`);
        } catch (error) {
            console.error('Update role error:', error.message);
        }
    }

    /**
     * Batch sync multiple users
     * Useful for initial migration
     * @param {Array} users - Array of MongoDB user objects
     */
    async batchSyncUsers(users) {
        console.log(`🔄 Batch syncing ${users.length} users to Firestore...`);

        const batch = db.batch();
        let count = 0;

        for (const user of users) {
            const userRef = db.collection('users').doc(user._id.toString());
            batch.set(userRef, {
                uid: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone || null,
                profileImage: user.profileImage || null,
                updatedAt: new Date()
            }, { merge: true });

            count++;

            // Firestore batch limit is 500
            if (count % 500 === 0) {
                await batch.commit();
                console.log(`✅ Synced ${count} users...`);
            }
        }

        // Commit remaining
        if (count % 500 !== 0) {
            await batch.commit();
        }

        console.log(`✅ Batch sync complete: ${count} users synced`);
        return count;
    }

    /**
     * Delete user from Firestore
     * @param {string} userId - MongoDB user ID
     */
    async deleteUser(userId) {
        try {
            await db.collection('users').doc(userId.toString()).delete();
            console.log(`✅ User ${userId} deleted from Firestore`);
        } catch (error) {
            console.error('Delete user error:', error.message);
        }
    }
}

module.exports = new FirebaseUserSync();
