import React, { useEffect } from 'react';
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

// Customer Screens
import PolicyDetailScreen from './screens/customer/PolicyDetailScreen';

// Customer Screens
import CustomerHomeScreen from './screens/customer/HomeScreen';
import CartScreen from './screens/customer/CartScreen';
import RecipesScreen from './screens/customer/RecipesScreen';
import RecipeDetailScreen from './screens/customer/RecipeDetailScreen';
import ForumScreen from './screens/customer/ForumScreen';
import ForumPostDetailScreen from './screens/customer/ForumPostDetailScreen';
import CreateForumPostScreen from './screens/customer/CreateForumPostScreen';
import SettingsScreen from './screens/customer/SettingsScreen';
import OrdersScreen from './screens/customer/OrdersScreen';
import RewardsScreen from './screens/customer/RewardsScreen';
import MyReviewsScreen from './screens/customer/MyReviewsScreen';
import RefundsScreen from './screens/customer/RefundsScreen';
import ReferralScreen from './screens/customer/ReferralScreen';
import SecurityScreen from './screens/customer/SecurityScreen';
import PrivacyScreen from './screens/customer/PrivacyScreen';
import LanguageScreen from './screens/customer/LanguageScreen';
import AccessibilityScreen from './screens/customer/AccessibilityScreen';

import ThemeScreen from './screens/customer/ThemeScreen';
import WithdrawalScreen from './screens/customer/WithdrawalScreen';
import HelpCenterScreen from './screens/customer/HelpCenterScreen';
import LegalScreen from './screens/customer/LegalScreen';
import ContactScreen from './screens/customer/ContactScreen';
import SupportChatScreen from './screens/customer/SupportChatScreen';

// Seller Screens (existing)
import SellerScreen from './screens/SellerScreen';
import SellerKycScreen from './screens/SellerKycScreen';
import AddDeliveryPartnerScreen from './screens/AddDeliveryPartnerScreen';

// Delivery Partner Screens
import DeliveryPartnerDashboard from './screens/DeliveryPartnerDashboard';
import DeliveryConfirmationScreen from './screens/DeliveryConfirmationScreen';
import OrderDetailsScreen from './screens/delivery/OrderDetailsScreen';
import DeliveryHistoryScreen from './screens/delivery/DeliveryHistoryScreen';
import DeliveryPartnerProfileScreen from './screens/delivery/DeliveryPartnerProfileScreen';
import ReplacementRequestScreen from './screens/delivery/ReplacementRequestScreen';
import DeliveryWithdrawalScreen from './screens/delivery/DeliveryWithdrawalScreen';

// Shared Screens
import ProfileScreen from './screens/shared/ProfileScreen';

// Bulk Order Screens
import BulkOrderScreen from './screens/BulkOrderScreen';
import BulkOrderDetailScreen from './screens/BulkOrderDetailScreen';
import ProductScreen from './screens/ProductScreen';
import CheckoutScreen from './screens/customer/CheckoutScreen';
import WishlistScreen from './screens/customer/WishlistScreen';
import NotificationsScreen from './screens/customer/NotificationsScreen';
import OrderDetailScreen from './screens/customer/OrderDetailScreen';
import OrderSuccessScreen from './screens/customer/OrderSuccessScreen';
import BookmarksScreen from './screens/customer/BookmarksScreen';

// Shared Profile Screens
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
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="TwoFactorVerify" component={TwoFactorVerifyScreen} />
    </Stack.Navigator>
  );
}

// Customer Tab Navigator — Premium Design
function CustomerTabs() {
  const { t } = useTranslation();
  const { Feather: FeatherIcons } = require('@expo/vector-icons');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, focused, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Cart') iconName = 'shopping-bag';
          else if (route.name === 'WishlistTab') iconName = 'heart';
          else if (route.name === 'Recipes') iconName = 'book-open';
          else if (route.name === 'Forum') iconName = 'message-square';
          else if (route.name === 'Profile') iconName = 'user';
          return <FeatherIcons name={iconName} size={focused ? 22 : 20} color={color} />;
        },
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Home" component={CustomerHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <Tab.Screen name="WishlistTab" component={WishlistScreen} options={{ title: 'Wishlist' }} />
      <Tab.Screen name="Recipes" component={RecipesScreen} options={{ title: t('recipes') }} />
      <Tab.Screen name="Forum" component={ForumScreen} options={{ title: t('forum') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// Customer Stack Navigator (Includes Tabs + Detail Screens)
function CustomerStack() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CustomerTabs"
        component={CustomerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductScreen}
        options={{ title: t('products') }}
      />
      <Stack.Screen
        name="BulkOrders"
        component={BulkOrderScreen}
        options={{ title: t('bulkOrder') }}
      />
      <Stack.Screen
        name="BulkOrderDetail"
        component={BulkOrderDetailScreen}
        options={{ title: t('orderStatus') }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: t('cart') }}
      />
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ title: t('myWishlist') }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: t('orders') || 'Orders' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: t('notifications') }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: t('orderStatus') }}
      />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{ title: t('myBookmarks') }}
      />
      <Stack.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{ title: t('recipes') }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: t('recipes') }}
      />
      <Stack.Screen
        name="Forum"
        component={ForumScreen}
        options={{ title: t('forum') }}
      />
      <Stack.Screen
        name="ForumPostDetail"
        component={ForumPostDetailScreen}
        options={{ title: t('forum') }}
      />
      <Stack.Screen
        name="CreateForumPost"
        component={CreateForumPostScreen}
        options={{ title: t('forum') }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('settings') }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: t('editProfile') }}
      />
      <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: t('addresses') }} />
      <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} options={{ title: t('addresses') }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: t('helpCenter') }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: t('about') }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: t('rewards') }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: t('myReviews') }} />
      <Stack.Screen name="Refunds" component={RefundsScreen} options={{ title: t('orderStatus') }} />
      <Stack.Screen name="Referral" component={ReferralScreen} options={{ title: t('referEarn') }} />
      <Stack.Screen name="Security" component={SecurityScreen} options={{ title: t('security') }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: t('privacy') }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ title: t('language') }} />
      <Stack.Screen name="Accessibility" component={AccessibilityScreen} options={{ title: t('accessibility') }} />
      <Stack.Screen name="Withdraw" component={WithdrawalScreen} options={{ title: t('withdraw') }} />

      <Stack.Screen name="Theme" component={ThemeScreen} options={{ title: t('theme') }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: t('helpCenter') }} />
      <Stack.Screen name="Legal" component={LegalScreen} options={{ title: t('legalPolicies') }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: t('helpCenter') }} />
      <Stack.Screen name="PolicyDetail" component={PolicyDetailScreen} />
      <Stack.Screen name="SupportChat" component={SupportChatScreen} options={{ title: t('helpCenter') }} />
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
        options={{ title: 'Seller Dashboard' }}
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
        name="DeliveryProfile"
        component={DeliveryPartnerProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Delivery Partner Stack Navigator
function DeliveryStack() {
  return (
    <Stack.Navigator>
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
    </Stack.Navigator>
  );
}

// Admin Restriction Screen
function AdminRestrictionScreen() {
  const dispatch = useDispatch();

  return (
    <View style={styles.restrictionContainer}>
      <MaterialIcons name="computer" size={100} color="#ccc" />
      <Text style={styles.restrictionTitle}>Admin Access</Text>
      <Text style={styles.restrictionText}>
        Admin features are only available on the web application.
      </Text>
      <Text style={styles.restrictionSubtext}>
        Please use a desktop browser to access admin functionality.
      </Text>
    </View>
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

  // Role-based navigation
  const role = user.role?.toLowerCase();

  if (role === 'customer') {
    return <CustomerStack />;
  } else if (role === 'seller') {
    return <SellerTabs />;
  } else if (role === 'deliverypartner' || role === 'delivery_partner') {
    return <DeliveryStack />;
  } else if (role === 'admin') {
    return <AdminRestrictionScreen />;
  }

  // Fallback to customer if role is unknown
  return <CustomerStack />;
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
  },
});