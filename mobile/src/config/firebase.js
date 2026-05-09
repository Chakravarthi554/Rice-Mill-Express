import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from './env';

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);

// Use AsyncStorage for auth persistence (keeps user logged in)
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };
