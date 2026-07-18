import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from './env';

// Hardcoded fallback Firebase config (ensures it always works in production builds)
const FALLBACK_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBeucVHbAGsjxPqdK7gn4fW8gn_MvfvgLs',
    authDomain: 'rice-express-7eef4.firebaseapp.com',
    projectId: 'rice-express-7eef4',
    storageBucket: 'rice-express-7eef4.firebasestorage.app',
    messagingSenderId: '381785078247',
    appId: '1:381785078247:web:5ab1c7a11eac590a1a6542',
    measurementId: 'G-3Z5ZM2LXRK',
};

// Use env config if valid, otherwise use hardcoded fallback
const firebaseConfig = (FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) 
    ? FIREBASE_CONFIG 
    : FALLBACK_FIREBASE_CONFIG;

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use AsyncStorage for auth persistence (keeps user logged in)
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (e) {
    // If auth was already initialized (e.g., hot reload), get the existing instance
    auth = getAuth(app);
}

export { auth };
