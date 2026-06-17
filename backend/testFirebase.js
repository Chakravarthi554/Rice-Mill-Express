const admin = require('firebase-admin');
const serviceAccount = require('./config/rice-express-7eef4-firebase-adminsdk-fbsvc-01dd764cb9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

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
