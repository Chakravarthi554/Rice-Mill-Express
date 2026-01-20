const { db } = require('../config/firebase');

/**
 * Firebase User Sync Service
 * Syncs MongoDB users to Firestore for Firebase rules to work
 */
class FirebaseUserSync {
    /**
     * Sync MongoDB user to Firestore
     * Call this after signup/login
     * @param {Object} user - MongoDB user object
     */
    async syncUser(user) {
        try {
            const userRef = db.collection('users').doc(user._id.toString());

            const userData = {
                uid: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone || null,
                profileImage: user.profileImage || null,
                businessDetails: user.businessDetails || null,
                isOnline: true,
                lastActive: new Date(),
                updatedAt: new Date()
            };

            await userRef.set(userData, { merge: true });

            console.log(`✅ User ${user.email} (${user.role}) synced to Firestore`);
            return true;
        } catch (error) {
            console.error('❌ Firestore sync error:', error.message);
            // Don't throw - sync failure shouldn't block login
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
