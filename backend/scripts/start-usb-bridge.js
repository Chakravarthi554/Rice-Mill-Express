const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const ENV_FILE_PATH = path.join(__dirname, '..', '..', 'mobile', 'src', 'config', 'env.js');

function startUsbBridge() {
    console.log('🚀 Starting Professional USB-Direct Bridge (ADB)...');
    console.log('--------------------------------------------------');

    try {
        // 1. Check if ADB is available
        const adbVersion = execSync('adb version').toString();
        // console.log('✅ ADB Found');

        // 2. Check for devices
        const devices = execSync('adb devices').toString();
        const lines = devices.trim().split('\n').slice(1);
        const authorizedDevices = lines.filter(line => line.includes('\tdevice'));
        const unauthorizedDevices = lines.filter(line => line.includes('\tunauthorized'));

        if (authorizedDevices.length > 0) {
            console.log('✅ AUTHORIZED DEVICE DETECTED');
            
            // 3. Execute Reverse Port Forwarding
            console.log(`🔗 Linking Phone:5000 <---> Laptop:${PORT} via USB...`);
            execSync(`adb reverse tcp:5000 tcp:${PORT}`);
            
            // 4. Update Mobile App to use localhost (over USB)
            const envContent = `// ⚡ POWERED BY USB-DIRECT BRIDGE\nexport const API_URL = 'http://localhost:${PORT}';\n`;
            fs.writeFileSync(ENV_FILE_PATH, envContent);
            
            console.log('\n✨ USB-DIRECT BRIDGE ACTIVE! ✨');
            console.log('--------------------------------------------------');
            console.log('1. Keep this USB cable plugged in.');
            console.log('2. Reload your app (Press "r" in Expo terminal).');
            console.log('✅ YOUR MOBILE APP NOW TALKS DIRECTLY TO YOUR LAPTOP OVER THE CABLE.');
            console.log('--------------------------------------------------');

        } else if (unauthorizedDevices.length > 0) {
            console.error('\n❌ ERROR: Phone is connected but NOT AUTHORIZED.');
            console.log('--------------------------------------------------');
            console.log('FIX STEPS:');
            console.log('1. Look at your Phone screen NOW.');
            console.log('2. Click "Always allow from this computer" and press OK.');
            console.log('3. Run this script again.');
            console.log('--------------------------------------------------');
        } else {
            console.error('\n❌ ERROR: No phone found via USB.');
            console.log('--------------------------------------------------');
            console.log('FIX STEPS:');
            console.log('1. Plug your phone into your laptop via USB cable.');
            console.log('2. Ensure "USB Debugging" is ON in Developer Options.');
            console.log('3. Check if your cable supports data (try a different port).');
            console.log('--------------------------------------------------');
        }
    } catch (err) {
        console.error('❌ FATAL ERROR:', err.message);
        if (err.message.includes('adb')) {
            console.log('Please ensure Android Platform Tools (adb) are installed.');
        }
    }
}

startUsbBridge();
