const fs = require('fs');
const path = require('path');
const appJs = fs.readFileSync('mobile/src/App.js', 'utf8');
const lines = appJs.split('\n');

const regex = /^import\s+({?[a-zA-Z0-9_, ]+}?)\s+from\s+['"](\.\/.*?)['"]/i;

let errors = [];

lines.forEach((line) => {
  const match = line.match(regex);
  if (match) {
    const importVars = match[1].trim();
    const importPathStr = match[2];
    let absolutePath = path.resolve('mobile/src', importPathStr);
    const exts = ['.js', '.jsx', '/index.js', '.ts', '.tsx', ''];
    let foundPath = null;
    for (const ext of exts) {
      if (fs.existsSync(absolutePath + ext)) {
        foundPath = absolutePath + ext;
        break;
      }
    }
    if (!foundPath) {
        errors.push('NOT FOUND: ' + importPathStr);
        return;
    }

    const content = fs.readFileSync(foundPath, 'utf8');
    const isDefaultImport = !importVars.includes('{');
    
    if (isDefaultImport && !content.includes('export default') && !content.includes('module.exports')) {
        errors.push('MISSING DEFAULT EXPORT in ' + foundPath + ' (Imported as ' + importVars + ')');
    }
  }
});

console.log(errors.length ? errors.join('\n') : 'All mobile imports seem fine.');
