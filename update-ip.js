/**
 * AUTO-IP-UPDATE SCRIPT
 * Run this before starting the app: node update-ip.js
 * It detects your current network IP and updates frontend/.env automatically.
 * This permanently solves the "wrong IP / timeout" login problem.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getCurrentIP() {
  try {
    const output = execSync('ipconfig', { encoding: 'utf8' });
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('IPv4') && !line.includes('127.0') && !line.includes('169.254')) {
        const match = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        if (match) return match[1];
      }
    }
  } catch (e) {}
  return 'localhost';
}

const currentIP = getCurrentIP();
const port = 5001;
const newURL = `http://${currentIP}:${port}`;

console.log(`\n🌐 Detected IP: ${currentIP}`);
console.log(`🔗 New API URL: ${newURL}`);

// Update frontend/.env
const envPath = path.join(__dirname, 'frontend', '.env');
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/REACT_APP_API_URL=.*/g, `REACT_APP_API_URL=${newURL}`);
  envContent = envContent.replace(/REACT_APP_BASE_URL=.*/g, `REACT_APP_BASE_URL=${newURL}`);
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ frontend/.env updated!');
}

// Update mobile env.js if it exists
const mobileEnvPath = path.join(__dirname, 'mobile', 'src', 'config', 'env.js');
if (fs.existsSync(mobileEnvPath)) {
  let mobileContent = fs.readFileSync(mobileEnvPath, 'utf8');
  mobileContent = mobileContent.replace(/export const API_URL = .*/g, `export const API_URL = '${newURL}';`);
  fs.writeFileSync(mobileEnvPath, mobileContent, 'utf8');
  console.log('✅ mobile/src/config/env.js updated!');
}

console.log('\n✅ Done! Now restart:\n  - Backend:  cd backend && npm start\n  - Frontend: cd frontend && npm start\n');
