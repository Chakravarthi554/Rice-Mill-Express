import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics'; // Optional, for Analytics

const firebaseConfig = {
  apiKey: "AIzaSyBeucVHbAGsjxPqdK7gn4fW8gn_MvfvgLs",
  authDomain: "rice-express-7eef4.firebaseapp.com",
  projectId: "rice-express-7eef4",
  storageBucket: "rice-express-7eef4.firebasestorage.app",
  messagingSenderId: "381785078247",
  appId: "1:381785078247:web:5ab1c7a11eac590a1a6542",
  measurementId: "G-3Z5ZM2LXRK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const analytics = getAnalytics(app); // Optional, initialize Analytics

export { messaging, getToken, onMessage, analytics }; // Export Analytics if needed