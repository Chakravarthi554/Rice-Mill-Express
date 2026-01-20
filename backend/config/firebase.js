const admin = require('firebase-admin');
const serviceAccount = require('./rice-express-7eef4-firebase-adminsdk-fbsvc-01dd764cb9.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'rice-express-7eef4.appspot.com'
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// Helper function to verify Firebase is working
const testConnection = async () => {
    try {
        const testDoc = await db.collection('_test').doc('connection').set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'connected'
        });
        console.log('✅ Firebase Admin connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase Admin connection failed:', error.message);
        return false;
    }
};

module.exports = {
    admin,
    db,
    auth,
    storage,
    testConnection
};
