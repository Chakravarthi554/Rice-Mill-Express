const { testConnection } = require('./config/firebase');

async function test() {
    console.log('🔥 Testing Firebase Admin connection...');
    console.log('');

    try {
        const result = await testConnection();

        if (result) {
            console.log('✅ SUCCESS: Firebase Admin is working!');
            console.log('');
            console.log('Next steps:');
            console.log('1. Test phone OTP in frontend');
            console.log('2. Use test number: +919876543210 with OTP: 123456');
            console.log('3. Check Firestore for delivery_confirmations collection');
            console.log('');
            process.exit(0);
        } else {
            console.log('❌ FAILED: Check your firebase-admin-key.json');
            console.log('');
            console.log('Troubleshooting:');
            console.log('1. Verify firebase-admin-key.json exists in backend/config/');
            console.log('2. Check file permissions');
            console.log('3. Ensure Firebase project ID matches');
            console.log('');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.log('');
        console.log('Stack trace:');
        console.error(error);
        process.exit(1);
    }
}

test();
