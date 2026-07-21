import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
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
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import TwoFactorVerifyScreen from './screens/auth/TwoFactorVerifyScreen';



// Seller Screens (existing)
import SellerScreen from './screens/SellerScreen';
import SellerKycScreen from './screens/SellerKycScreen';
import AddDeliveryPartnerScreen from './screens/AddDeliveryPartnerScreen';
import ForumScreen from './screens/ForumScreen';
import ForumPostDetailScreen from './screens/ForumPostDetailScreen';
import CreateForumPostScreen from './screens/CreateForumPostScreen';
import RecipesScreen from './screens/RecipesScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';



// Bulk Order Screens

// Shared Profile Screens
import ProfileScreen from './screens/shared/ProfileScreen';
import EditProfileScreen from './screens/shared/EditProfileScreen';
import AddressesScreen from './screens/shared/AddressesScreen';
import AddEditAddressScreen from './screens/shared/AddEditAddressScreen';
import { SupportScreen, AboutScreen } from './screens/shared/SupportAboutScreens';
import SettingsScreen from './screens/shared/SettingsScreen';
import NotificationsScreen from './screens/shared/NotificationsScreen';
import HelpCenterScreen from './screens/shared/HelpCenterScreen';
import SupportChatScreen from './screens/shared/SupportChatScreen';
import LanguageScreen from './screens/shared/LanguageScreen';
import ThemeScreen from './screens/shared/ThemeScreen';
import SecurityScreen from './screens/shared/SecurityScreen';
import PrivacyScreen from './screens/shared/PrivacyScreen';
import LegalScreen from './screens/shared/LegalScreen';
import AccessibilityScreen from './screens/shared/AccessibilityScreen';
import AddProductScreen from './screens/AddProductScreen';
import EditProductScreen from './screens/EditProductScreen';
import OrderDetailScreen from './screens/shared/OrderDetailScreen';
import PolicyDetailScreen from './screens/shared/PolicyDetailScreen';
import ContactScreen from './screens/shared/ContactScreen';
import SellerOrdersScreen from './screens/SellerOrdersScreen';
import SellerProductsScreen from './screens/SellerProductsScreen';
import SellerPaymentsScreen from './screens/SellerPaymentsScreen';
import SellerDeliveryScreen from './screens/SellerDeliveryScreen';
import SellerAnalyticsScreen from './screens/SellerAnalyticsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="TwoFactorVerify" component={TwoFactorVerifyScreen} />
    </Stack.Navigator>
  );
}

// Seller Tab Navigator
function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'dashboard';
          else if (route.name === 'KYC') iconName = 'verified-user';
          else if (route.name === 'Profile') iconName = 'person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={SellerScreen}
        options={{ title: 'Rice Mill Express' }}
      />
      <Tab.Screen
        name="KYC"
        component={SellerKycScreen}
        options={{ title: 'KYC Application' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Seller Stack Navigator (Wraps Tabs and Auxiliary Screens)
function SellerStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator>
      <Stack.Screen name="SellerTabs" component={SellerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add Product' }} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Edit Product' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings') || 'Settings' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: t('editProfile') || 'Edit Profile' }} />
      <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: t('addresses') || 'Addresses' }} />
      <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} options={{ title: t('addresses') || 'Addresses' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: t('helpCenter') || 'Support' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: t('about') || 'About' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t('notifications') || 'Notifications' }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: t('helpCenter') || 'Help Center' }} />
      <Stack.Screen name="SupportChat" component={SupportChatScreen} options={{ title: 'Support Chat' }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ title: 'Language' }} />
      <Stack.Screen name="Theme" component={ThemeScreen} options={{ title: 'Theme' }} />
      <Stack.Screen name="Security" component={SecurityScreen} options={{ title: 'Security' }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy' }} />
      <Stack.Screen name="Legal" component={LegalScreen} options={{ title: 'Legal' }} />
      <Stack.Screen name="Accessibility" component={AccessibilityScreen} options={{ title: 'Accessibility' }} />
      <Stack.Screen name="PolicyDetail" component={PolicyDetailScreen} options={{ title: 'Policy Details' }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact Us' }} />
      <Stack.Screen name="AddDeliveryPartner" component={AddDeliveryPartnerScreen} options={{ title: 'Add Delivery Partner' }} />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} options={{ title: 'Manage Orders' }} />
      <Stack.Screen name="SellerProducts" component={SellerProductsScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="SellerPayments" component={SellerPaymentsScreen} options={{ title: 'Payments' }} />
      <Stack.Screen name="SellerDelivery" component={SellerDeliveryScreen} options={{ title: 'Delivery Partners' }} />
      <Stack.Screen name="SellerAnalytics" component={SellerAnalyticsScreen} options={{ title: 'Analytics' }} />
      <Stack.Screen name="Forum" component={ForumScreen} options={{ title: 'Forum' }} />
      <Stack.Screen name="ForumPostDetail" component={ForumPostDetailScreen} options={{ title: 'Discussion' }} />
      <Stack.Screen name="CreateForumPost" component={CreateForumPostScreen} options={{ title: 'New Post' }} />
      <Stack.Screen name="Recipes" component={RecipesScreen} options={{ title: 'Recipes' }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Recipe' }} />
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, isAuthenticated, loading, isAuthReady } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Load user from AsyncStorage ONCE at startup
    dispatch(loadUserFromStorage());

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

  if (loading || !isAuthReady) {
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

  const role = user?.role;
  if (role === 'seller') {
    return <SellerStack />;
  } else {
    return <SellerTabs />;
  }
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


  // Backend checks now run silently in the background


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
  },
});