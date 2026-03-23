const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PORT = 5000;
const ENV_FILE_PATH = path.join(__dirname, '..', '..', 'mobile', 'src', 'config', 'env.js');

async function startNgrok() {
    console.log(`🔄 Starting Global Public Bridge (Ngrok via NPX) for port ${PORT}...`);
    
    // Start ngrok process with shell: true for Windows/npx compatibility
    const ngrok = spawn('npx', ['ngrok', 'http', PORT.toString()], { shell: true });

    ngrok.stdout.on('data', (data) => {
        // We don't get much from stdout directly usually
    });

    ngrok.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('error')) console.error(`❌ Ngrok Error: ${msg}`);
    });

    // Wait a bit for ngrok to settle, then poll the internal API for the URL
    // (Ngrok exposes a local introspection API at http://localhost:4040)
    console.log('⏳ Waiting for public URL assignment...');
    
    let attempts = 0;
    const maxAttempts = 10;
    
    const pollInterval = setInterval(async () => {
        attempts++;
        try {
            const response = await axios.get('http://localhost:4040/api/tunnels');
            const tunnel = response.data.tunnels.find(t => t.proto === 'https');
            
            if (tunnel && tunnel.public_url) {
                clearInterval(pollInterval);
                const publicUrl = tunnel.public_url;
                
                console.log('\n✅ Global Public Bridge Active!');
                console.log(`🔗 Public URL: \x1b[36m${publicUrl}\x1b[0m`);
                console.log('ℹ️  This works on ANY network (4G, 5G, Home WiFi).');

                // Update mobile env.js
                const envContent = `export const API_URL = process.env.EXPO_PUBLIC_API_URL || '${publicUrl}';\n`;
                fs.writeFileSync(ENV_FILE_PATH, envContent);
                console.log(`📝 Updated mobile/src/config/env.js with ${publicUrl}`);
                
                console.log('\n✨ YOUR APP IS NOW GLOBALLY CONNECTED ✨');
                console.log('The "Network Error" will vanish after you reload the app.');
            }
        } catch (err) {
            if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                console.error('\n❌ ERROR: Failed to get Public URL from Ngrok API.');
                console.log('Please ensure "npx ngrok" is working manually.');
            }
        }
    }, 2000);

    ngrok.on('close', (code) => {
        console.log(`❌ Ngrok tunnel closed (Exit code: ${code})`);
    });
}

startNgrok();
