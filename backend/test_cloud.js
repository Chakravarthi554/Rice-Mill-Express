require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinary() {
    try {
        console.log('Testing Cloudinary configuration:', {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY
        });
        const result = await cloudinary.api.ping();
        console.log('✅ Success! Cloudinary ping result:', result);
    } catch (error) {
        console.error('❌ Cloudinary Failure:');
        console.error(JSON.stringify(error, null, 2));
    }
}

testCloudinary();
