let admin, db, auth, storage;
let isFirebaseInitialized = false;

try {
    const firebaseAdmin = require('firebase-admin');

    // Load credentials from environment variables (never from a committed JSON file)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') // Handle escaped newlines from .env
        : undefined;

    if (projectId && clientEmail && privateKey) {
        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            storageBucket: `${projectId}.appspot.com`
        });

        admin = firebaseAdmin;
        db = admin.firestore();
        auth = admin.auth();
        storage = admin.storage();
        isFirebaseInitialized = true;
        console.log('✅ Firebase Admin initialized successfully');
    } else {
        console.warn('⚠️ Firebase Admin SDK env vars missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Firebase features will be disabled.');
        throw new Error('Firebase environment variables missing');
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
