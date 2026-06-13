// mobile/src/config/env.js
// ─────────────────────────────────────────────────────────────────────────────
// Environment Configuration — Rice Mill Express Mobile
//
// HOW IT WORKS:
//   npm run start:dev  → APP_ENV=development → loads .env.development
//   npm run start:prod → APP_ENV=production  → loads .env.production
//
// Expo 49+ exposes EXPO_PUBLIC_* variables via process.env at runtime.
// The APP_ENV flag selects which .env file Expo loads at startup.
// ─────────────────────────────────────────────────────────────────────────────

// Hardcoded fallback map (used if process.env is not populated)
const ENV_MAP = {
  development: {
    API_URL: 'http://localhost:5001',
    ENVIRONMENT: 'development',
    DEBUG: true,
  },
  production: {
    API_URL: 'http://13.62.55.108:5001',
    ENVIRONMENT: 'production',
    DEBUG: false,
  },
};

const getEnvConfig = () => {
  // Priority 1: EXPO_PUBLIC_* runtime variables (from .env.development / .env.production)
  const runtimeApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const runtimeEnv = process.env.EXPO_PUBLIC_ENVIRONMENT;

  if (runtimeApiUrl) {
    return {
      API_URL: runtimeApiUrl,
      ENVIRONMENT: runtimeEnv || 'development',
      DEBUG: process.env.EXPO_PUBLIC_DEBUG === 'true',
      FIREBASE: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      },
    };
  }

  // Priority 2: APP_ENV flag fallback (hardcoded map)
  const appEnv = process.env.APP_ENV || 'development';
  const config = ENV_MAP[appEnv] || ENV_MAP.development;

  return {
    ...config,
    FIREBASE: {
      apiKey: 'AIzaSyBeucVHbAGsjxPqdK7gn4fW8gn_MvfvgLs',
      authDomain: 'rice-express-7eef4.firebaseapp.com',
      projectId: 'rice-express-7eef4',
      storageBucket: 'rice-express-7eef4.firebasestorage.app',
      messagingSenderId: '381785078247',
      appId: '1:381785078247:web:5ab1c7a11eac590a1a6542',
      measurementId: 'G-3Z5ZM2LXRK',
    },
  };
};

const config = getEnvConfig();

// ─── Named exports (import these wherever needed) ──────────────────────────
export const API_URL = 'http://10.17.170.143:5001';
export const ENVIRONMENT = config.ENVIRONMENT;
export const IS_DEV = config.ENVIRONMENT === 'development';
export const IS_PROD = config.ENVIRONMENT === 'production';
export const FIREBASE_CONFIG = config.FIREBASE;

// ─── Startup log (only in debug mode) ────────────────────────────────────
if (config.DEBUG) {
  console.log('📱 [ENV] Active Configuration:');
  console.log(`  🌍 Environment : ${config.ENVIRONMENT}`);
  console.log(`  🔗 API URL     : ${config.API_URL}`);
  console.log(`  🐛 Debug Mode  : ${config.DEBUG}`);
}

export default config;
