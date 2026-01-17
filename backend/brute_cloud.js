require('dotenv').config();
const cloudinary = require('cloudinary').v2;

const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

async function testCloud(name) {
    cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret });
    try {
        await cloudinary.api.ping();
        console.log(`✅ FOUND! Cloud name is: ${name}`);
        return true;
    } catch (e) {
        console.log(`❌ No: ${name} (${e.error?.message || e.message})`);
        return false;
    }
}

async function start() {
    const candidates = ['chakri554', 'chakravarthi554', 'chakri', 'chakravarthi', 'ricemill', 'ricemillexpress'];
    for (const name of candidates) {
        if (await testCloud(name)) break;
    }
}

start();
