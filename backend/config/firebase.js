let admin, db, auth, storage;
let isFirebaseInitialized = false;

try {
    const firebaseAdmin = require('firebase-admin');
    const path = require('path');
    const fs = require('fs');

    const serviceAccountPath = path.join(__dirname, './rice-express-7eef4-firebase-adminsdk-fbsvc-01dd764cb9.json');

    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);

        // Initialize Firebase Admin
        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(serviceAccount),
            storageBucket: 'rice-express-7eef4.appspot.com'
        });

        admin = firebaseAdmin;
        db = admin.firestore();
        auth = admin.auth();
        storage = admin.storage();
        isFirebaseInitialized = true;
        console.log('✅ Firebase Admin initialized successfully');
    } else {
        console.warn('⚠️ Firebase service account file not found. Firebase features will be disabled.');
        throw new Error('Service account missing');
    }
} catch (error) {
    console.error('⚠️ Firebase Admin could not be initialized:', error.message);

    // Provide mock objects to prevent crashes on require
    const mockFunc = () => {
        console.warn('❌ Firebase is not initialized. This action has no effect.');
        return {
            collection: mockFunc,
            doc: mockFunc,
            set: mockFunc,
            get: mockFunc,
            update: mockFunc,
            delete: mockFunc,
            verifyIdToken: async () => { throw new Error('Firebase not initialized'); },
            createCustomToken: async () => { throw new Error('Firebase not initialized'); }
        };
    };

    admin = {
        firestore: () => ({ collection: mockFunc }),
        auth: () => ({ verifyIdToken: mockFunc, createCustomToken: mockFunc }),
        storage: () => ({ bucket: mockFunc }),
        credential: { cert: () => ({}) },
        initializeApp: () => ({})
    };
    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage();
}

// Helper function to verify Firebase is working
const testConnection = async () => {
    if (!isFirebaseInitialized) return false;
    try {
        const testDoc = await db.collection('_test').doc('connection').set({
            timestamp: new Date(),
            status: 'connected'
        });
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
    testConnection,
    isFirebaseInitialized
};
