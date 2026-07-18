import { NativeModules } from 'react-native';

const GoogleSigninMock = {
  configure: () => {},
  hasPlayServices: async () => false,
  signIn: async () => { throw new Error('Google Sign-In is not supported in Expo Go'); },
  signOut: async () => {},
};

let GoogleSignin = GoogleSigninMock;
let statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

try {
  const NativeModule = NativeModules.RNGoogleSignin;
  if (NativeModule) {
    const ActualGoogle = require('@react-native-google-signin/google-signin');
    GoogleSignin = ActualGoogle.GoogleSignin;
    statusCodes = ActualGoogle.statusCodes;
  } else {
    console.warn('⚠️ Google Sign-In native module not found. Falling back to mock implementation for Expo Go compatibility.');
  }
} catch (e) {
  console.warn('⚠️ Failed to load Google Sign-In native module. Using mock fallback.', e.message);
}

export { GoogleSignin, statusCodes };
