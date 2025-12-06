import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics'; // Optional, for Analytics

const firebaseConfig = {
  apiKey: "AIzaSyCGnTOMaW6IEZb08euDbEwXXav6qz_ZBSs",
  authDomain: "rice-mill-ca2c3.firebaseapp.com",
  projectId: "rice-mill-ca2c3",
  storageBucket: "rice-mill-ca2c3.firebasestorage.app",
  messagingSenderId: "935334885868",
  appId: "1:935334885868:web:56ad7b19b9c2e6daeee8c9",
  measurementId: "G-KF8S58RTWB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const analytics = getAnalytics(app); // Optional, initialize Analytics

export { messaging, getToken, onMessage, analytics }; // Export Analytics if needed