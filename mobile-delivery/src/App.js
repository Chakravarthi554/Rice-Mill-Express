import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme
} from 'react-native-paper';
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import store, { persistor } from './redux/store';
import { setupInterceptors } from './services/api';
import { loadUserFromStorage, setCredentials, setAuthReady, logout } from './redux/slices/authSlice';
import { fetchSettings } from './redux/slices/settingsSlice';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import MobileErrorBoundary from './components/MobileErrorBoundary';

// Sentry integration removed

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

// Initialize API interceptors with store
setupInterceptors(store, logout);

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import TwoFactorVerifyScreen from './screens/auth/TwoFactorVerifyScreen';




// Delivery Partner Screens
import DeliveryPartnerDashboard from './screens/DeliveryPartnerDashboard';
import OnboardingScreen from './screens/OnboardingScreen';
import DeliveryConfirmationScreen from './screens/DeliveryConfirmationScreen';
import OrderDetailsScreen from './screens/delivery/OrderDetailsScreen';
import DeliveryHistoryScreen from './screens/delivery/DeliveryHistoryScreen';
import DeliveryPartnerProfileScreen from './screens/delivery/DeliveryPartnerProfileScreen';
import ReplacementRequestScreen from './screens/delivery/ReplacementRequestScreen';
import DeliveryWithdrawalScreen from './screens/delivery/DeliveryWithdrawalScreen';
import SupportChatScreen from './screens/delivery/SupportChatScreen';
import RaiseIssueScreen from './screens/delivery/RaiseIssueScreen';



// Shared Profile Screens
import ProfileScreen from './screens/shared/ProfileScreen';
import EditProfileScreen from './screens/shared/EditProfileScreen';
import AddressesScreen from './screens/shared/AddressesScreen';
import AddEditAddressScreen from './screens/shared/AddEditAddressScreen';
import { SupportScreen, AboutScreen } from './screens/shared/SupportAboutScreens';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="TwoFactorVerify" component={TwoFactorVerifyScreen} />
    </Stack.Navigator>
  );
}

// Delivery Partner Tab Navigator
function DeliveryTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Dashboard"
        component={DeliveryPartnerDashboard}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="DeliveryHistory"
        component={DeliveryHistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="WithdrawTab"
        component={DeliveryWithdrawalScreen}
        options={{ title: 'Wallet' }}
      />
      <Tab.Screen
        name="DeliveryProfile"
        component={DeliveryPartnerProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Delivery Partner Stack Navigator
function DeliveryStack({ initialRoute }) {
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="DeliveryTabs"
        component={DeliveryTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen
        name="ReplacementRequest"
        component={ReplacementRequestScreen}
        options={{ title: 'Request Replacement' }}
      />
      <Stack.Screen
        name="DeliveryConfirmation"
        component={DeliveryConfirmationScreen}
        options={{ title: 'Confirm Delivery' }}
      />
      <Stack.Screen
        name="Withdraw"
        component={DeliveryWithdrawalScreen}
        options={{ title: 'Withdraw' }}
      />
      <Stack.Screen
        name="SupportChat"
        component={SupportChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RaiseIssue"
        component={RaiseIssueScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, isAuthenticated, loading, isAuthReady } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

  useEffect(() => {
    // 1. Load user from AsyncStorage ONCE at startup
    dispatch(loadUserFromStorage());

    AsyncStorage.getItem('hasSeenOnboarding').then(val => {
      setHasSeenOnboarding(val === 'true');
    });

    // 2. Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('✅ Firebase auth state: User signed in');
          const token = await firebaseUser.getIdToken();
          const storedUserInfo = await AsyncStorage.getItem('userInfo');

          if (storedUserInfo) {
            const user = JSON.parse(storedUserInfo);
            // Don't store the token in Redux — the API interceptor always fetches
            // a fresh token from auth.currentUser on every request.
            dispatch(setCredentials({ user, token: null }));
            console.log('🔄 Redux state updated from fresh Firebase session');
          }
        } else {
          console.log('ℹ️ Firebase auth state: User signed out');
          // Note: We handle sync/logout in a separate useEffect to avoid race conditions
        }
      } catch (error) {
        console.error('❌ Auth listener error:', error);
      } finally {
        // ESSENTIAL: Always set auth ready to prevent stuck loading screen
        dispatch(setAuthReady(true));
      }
    });

    return () => unsubscribe();
  }, [dispatch]); // Removed isAuthenticated dependency

  // 3. Keep Redux in sync with Firebase sign-out
  useEffect(() => {
    if (isAuthReady && !auth.currentUser && isAuthenticated) {
      // Only auto-logout if no backend token exists in AsyncStorage
      // This allows delivery partners (non-Firebase users) to stay authenticated
      AsyncStorage.getItem('userToken').then((token) => {
        if (!token) {
          console.log('🔄 Syncing Redux state: No token found, logging out...');
          dispatch(logout());
        } else {
          console.log('🛄 Skipping auto-logout: backend token exists (non-Firebase user)');
        }
      }).catch(() => {
        dispatch(logout());
      });
    }
  }, [isAuthReady, isAuthenticated, dispatch]);

  if (loading || !isAuthReady || hasSeenOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthStack />;
  }

  if (user.role !== 'deliveryPartner') {
    return (
      <View style={styles.restrictionContainer}>
        <MaterialIcons name="security" size={64} color="#EF4444" />
        <Text style={styles.restrictionTitle}>Access Restricted</Text>
        <Text style={styles.restrictionText}>
          This app is strictly for registered Delivery Partners.
        </Text>
        <Text style={styles.restrictionSubtext}>
          Logged in as: {user.email || user.name || 'User'} ({user.role || 'customer'})
        </Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
          <Text style={styles.logoutBtnText}>Log Out & Switch Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <DeliveryStack initialRoute={hasSeenOnboarding ? 'DeliveryTabs' : 'Onboarding'} />;
}

function MainContent() {
  const dispatch = useDispatch();
  const systemColorScheme = useColorScheme();
  const { accessibility, preferences } = useSelector((state) => state.settings);
  const { isAuthReady, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      dispatch(fetchSettings());
    }
  }, [isAuthReady, isAuthenticated, dispatch]);

  // Determine base theme based on preference
  const themePreference = preferences?.theme || 'system';
  const isDark = themePreference === 'dark' || (themePreference === 'system' && systemColorScheme === 'dark');
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const navigationTheme = isDark ? DarkTheme : LightTheme;

  // Create dynamic theme with accessibility scaling
  const baseTextSize = 16;
  const scale = (accessibility?.textSize || baseTextSize) / baseTextSize;

  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: '#4CAF50',
      // Simple high contrast implementation
      ...(accessibility?.highContrast > 50 ? {
        surface: isDark ? '#121212' : '#ffffff',
        onSurface: isDark ? '#ffffff' : '#000000',
        outline: isDark ? '#ffffff' : '#000000',
        background: isDark ? '#000000' : '#ffffff',
      } : {})
    },
    fonts: Object.fromEntries(
      Object.entries(baseTheme.fonts).map(([key, font]) => [
        key,
        { ...font, fontSize: Math.round(font.fontSize * scale) }
      ])
    )
  };

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

import { PersistGate } from 'redux-persist/integration/react';

export default function App() {

  return (
    <MobileErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <MainContent />
        </PersistGate>
      </Provider>
    </MobileErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  restrictionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  restrictionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  restrictionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  restrictionSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  logoutBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});