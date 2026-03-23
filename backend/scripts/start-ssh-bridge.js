const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const ENV_FILE_PATH = path.join(__dirname, '..', '..', 'mobile', 'src', 'config', 'env.js');

async function startSshBridge() {
    console.log(`🔄 Starting Professional Zero-Setup Bridge (SSH) for port ${PORT}...`);
    
    // Command: ssh -R 80:localhost:5000 nokey@localhost.run
    // -o StrictHostKeyChecking=no to avoid interactive prompts
    const ssh = spawn('ssh', [
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ServerAliveInterval=60',
        '-R', `80:localhost:${PORT}`,
        'nokey@localhost.run'
    ], { shell: true });

    ssh.stdout.on('data', (data) => {
        const output = data.toString();
        // console.log(`SSH Out: ${output}`);
        
        // Look for the URL in the output (e.g., "https://your-app.lhr.life" or similar)
        const urlMatch = output.match(/https:\/\/[a-z0-9-.]+\.lhr\.life|https:\/\/[a-z0-9-.]+\.localhost\.run/);
        if (urlMatch) {
            const publicUrl = urlMatch[0];
            console.log('\n✅ Zero-Setup Bridge Active!');
            console.log(`🔗 Public URL: \x1b[36m${publicUrl}\x1b[0m`);
            console.log('ℹ️  No accounts, no simple passwords, no landing pages.');

            // Update mobile env.js with FORCE-SYNC logic
            const envContent = `// 🚀 Force-Synced by Professional Bridge\nexport const API_URL = '${publicUrl}';\n`;
            fs.writeFileSync(ENV_FILE_PATH, envContent);
            console.log(`📝 Force-Synced mobile/src/config/env.js with ${publicUrl}`);
            
            console.log('\n✨ YOUR APP IS NOW GLOBALLY CONNECTED ✨');
            console.log('The "Network Error" will be gone. Reload your app now!');
        }
    });

    ssh.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('error')) console.error(`⚠️ SSH Warning: ${msg}`);
    });

    ssh.on('close', (code) => {
        console.log(`❌ SSH bridge closed (Exit code: ${code}). Retrying in 5s...`);
        setTimeout(startSshBridge, 5000);
    });
}

startSshBridge();
