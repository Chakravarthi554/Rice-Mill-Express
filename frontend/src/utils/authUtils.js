import { auth } from '../firebase';
import store from '../redux/store';
import { USER_LOGIN_SUCCESS } from '../redux/constants/userConstants';
import { updateSocketToken } from './socket';

/**
 * 🔐 Centralized Firebase Token Refresh
 * Refreshes the ID token from Firebase, updates LocalStorage, Redux, and the Socket connection.
 * @returns {Promise<string|null>} The new access token, or null if refresh failed.
 */
export const refreshFirebaseToken = async () => {
  try {
    if (!auth) return null;

    // If auth is not ready, wait for it to initialize (e.g. on page refresh)
    if (!auth.currentUser) {
      console.log('🔄 authUtils: Firebase auth not ready, waiting for initialization...');
      await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
        setTimeout(resolve, 3000); // 3-second fallback timeout
      });
    }

    if (!auth.currentUser) {
      console.warn('⚠️ authUtils: No current Firebase user found for refresh after waiting');
      return null;
    }

    console.log('🔄 authUtils: Force-refreshing Firebase ID token...');
    // Force refresh the token
    const newToken = await auth.currentUser.getIdToken(true);

    if (!newToken) {
      throw new Error('Failed to retrieve new ID token from Firebase');
    }

    // 1. Update LocalStorage (Access Token)
    localStorage.setItem('token', newToken);

    // 2. Update LocalStorage (UserInfo object)
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (storedUserInfo) {
      const updatedUserInfo = { ...storedUserInfo, token: newToken };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      // 3. Update Redux store
      store.dispatch({
        type: USER_LOGIN_SUCCESS,
        payload: updatedUserInfo,
      });
      console.log('💾 authUtils: Redux store updated with fresh token');
    }

    // 4. Update Socket auth dynamically
    updateSocketToken(newToken);

    console.log('✅ authUtils: Global session refresh complete');
    return newToken;
  } catch (error) {
    console.error('❌ authUtils: Token refresh failed:', error.message);
    return null;
  }
};
