const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/context/AuthContext.js');
let content = fs.readFileSync(file, 'utf8');

// Find the catch block for syncError and replace it
const searchStr = "dispatch({ type: USER_LOGIN_FAIL, payload: errMsg });\n            setUser(firebaseUser); // Fallback to raw firebase user";
const replaceStr = `// CRITICAL FIX: Never dispatch USER_LOGIN_FAIL on network errors.
            // It wipes Redux state and blocks login completely.
            // Instead fall back gracefully to cached data.
            let mergedUser = null;
            const cachedRaw = localStorage.getItem('userInfo');
            if (cachedRaw) {
              try {
                const cached = JSON.parse(cachedRaw);
                if (cached.uid === firebaseUser.uid) {
                  const freshToken = await firebaseUser.getIdToken().catch(() => cached.token);
                  mergedUser = { ...cached, token: freshToken };
                }
              } catch (_e) {}
            }
            if (!mergedUser) {
              const freshToken = await firebaseUser.getIdToken().catch(() => null);
              mergedUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
                role: 'customer',
                token: freshToken,
                profileImage: firebaseUser.photoURL || '/uploads/default_avatar.jpg',
              };
            }
            if (mergedUser.token) localStorage.setItem('token', mergedUser.token);
            localStorage.setItem('userInfo', JSON.stringify(mergedUser));
            dispatch({ type: USER_LOGIN_SUCCESS, payload: mergedUser });
            updateUser(mergedUser);`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('SUCCESS: AuthContext.js - sync fallback fix applied!');
} else {
  // Show what the catch block looks like now
  const idx = content.indexOf('syncError');
  if (idx >= 0) {
    console.log('Current syncError block:');
    console.log(content.substring(idx - 20, idx + 400));
  } else {
    console.log('ERROR: Could not find syncError in file');
  }
}

// Also verify .env is correct
const envFile = path.join(__dirname, 'frontend/.env');
const envContent = fs.readFileSync(envFile, 'utf8');
const urlLine = envContent.split('\n').find(l => l.startsWith('REACT_APP_API_URL'));
console.log('Current REACT_APP_API_URL:', urlLine);
