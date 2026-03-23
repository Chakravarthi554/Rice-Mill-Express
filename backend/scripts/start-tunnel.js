const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 5000;
const ENV_FILE_PATH = path.join(__dirname, '..', '..', 'mobile', 'src', 'config', 'env.js');

async function startTunnel() {
    console.log(`🔄 Attempting to start Localtunnel for port ${PORT}...`);
    
    try {
        const tunnel = await localtunnel({ port: PORT });

        console.log('✅ Tunnel started!');
        console.log(`🔗 Public URL: \x1b[36m${tunnel.url}\x1b[0m`);
        
        // Fetch public IP for the "password" (though bypass header should handle programmatic requests)
        const ipResponse = await new Promise((resolve) => {
            http.get('http://api.ipify.org', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', () => resolve('Unknown'));
        });
        
        console.log(`🔑 Tunnel Password (Public IP): \x1b[33m${ipResponse}\x1b[0m`);
        console.log('ℹ️  If the app shows a landing page, enter this IP in the phone browser once.');

        // Update mobile env.js
        const envContent = `export const API_URL = process.env.EXPO_PUBLIC_API_URL || '${tunnel.url}';\n`;
        fs.writeFileSync(ENV_FILE_PATH, envContent);
        console.log(`📝 Updated mobile/src/config/env.js with ${tunnel.url}`);

        tunnel.on('close', () => {
            console.log('❌ Tunnel closed. Retrying in 5 seconds...');
            setTimeout(startTunnel, 5000);
        });

        // Keep process alive
        setInterval(() => {}, 1000);

    } catch (err) {
        console.error('❌ Failed to start tunnel:', err.message);
        setTimeout(startTunnel, 5000);
    }
}

startTunnel();
