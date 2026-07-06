const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

let replacedCount = 0;

walkDir(path.join(__dirname, 'frontend/src'), function(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace literal string paths
    content = content.replace(/'\/api\//g, "'/api/v1/");
    content = content.replace(/"\/api\//g, '"/api/v1/');
    content = content.replace(/`\/api\//g, '`/api/v1/');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      replacedCount++;
      console.log(`Updated: ${filePath}`);
    }
  }
});

console.log(`Total files updated: ${replacedCount}`);
