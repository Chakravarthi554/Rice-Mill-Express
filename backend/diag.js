require('dotenv').config();
const cloudinary = require('./config/cloudinary');
console.log('✅ Final Cloudinary Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'PRESENT' : 'MISSING'
});
