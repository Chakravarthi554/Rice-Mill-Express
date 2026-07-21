const fs = require('fs');
const path = require('path');

const OLD_IP = '13.62.55.108';
const NEW_IP = '13.63.246.61';

const filesToUpdate = [
  'mobile-seller/src/config/env.js',
  'mobile-seller/src/App.js',
  'mobile-seller/eas.json',
  'mobile-seller/.env.production',
  'mobile-customer/src/config/env.js',
  'mobile-customer/src/App.js',
  'mobile-customer/eas.json',
  'mobile-customer/.env.production',
  'mobile-delivery/src/config/env.js',
  'mobile-delivery/src/App.js',
  'mobile-delivery/eas.json',
  'mobile-delivery/.env.production',
  'mobile/eas.json',
  'mobile/.env.production',
  'frontend/.env.production',
  'backend/models/Recipe.js',
  'backend/models/Product.js',
  'backend/app.js',
  'fix-urls.js',
];

let totalReplacements = 0;

filesToUpdate.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const count = (content.match(new RegExp(OLD_IP, 'g')) || []).length;
    if (count > 0) {
      content = content.replace(new RegExp(OLD_IP, 'g'), NEW_IP);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${file} - replaced ${count} occurrences`);
      totalReplacements += count;
    } else {
      console.log(`⏭️  ${file} - no old IP found`);
    }
  } else {
    console.log(`⚠️  ${file} - file not found, skipping`);
  }
});

// Also update .env and .env.development files
['mobile-seller', 'mobile-customer', 'mobile-delivery', 'mobile', 'frontend'].forEach(dir => {
  ['.env', '.env.development'].forEach(envFile => {
    const fullPath = path.join(__dirname, dir, envFile);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const count = (content.match(new RegExp(OLD_IP, 'g')) || []).length;
      if (count > 0) {
        content = content.replace(new RegExp(OLD_IP, 'g'), NEW_IP);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${dir}/${envFile} - replaced ${count} occurrences`);
        totalReplacements += count;
      }
    }
  });
});

console.log(`\n🎉 Done! Total replacements: ${totalReplacements}`);
console.log(`\n📱 New API URL: http://${NEW_IP}:5001`);
