const dotenv = require('dotenv');
dotenv.config();

const { admin, isFirebaseInitialized } = require('./config/firebase');

if (!isFirebaseInitialized) {
  console.error('❌ Firebase not initialized. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env');
  process.exit(1);
}

async function test() {
  try {
    const userRecord = await admin.auth().createUser({
      email: 'testdelivery' + Date.now() + '@example.com',
      emailVerified: false,
      password: 'secretPassword123',
      displayName: 'Test Delivery',
      disabled: false,
    });
    console.log('Successfully created new user:', userRecord.uid);
  } catch (error) {
    console.error('Error creating new user:', error);
  }
}

test();
