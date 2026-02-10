import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import store from './redux/store';
import { loadUserFromStorage, setCredentials, setAuthReady } from './redux/slices/authSlice';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';

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
import SubscriptionsScreen from './screens/customer/SubscriptionsScreen';
import SecurityScreen from './screens/customer/SecurityScreen';
import PrivacyScreen from './screens/customer/PrivacyScreen';
import LanguageScreen from './screens/customer/LanguageScreen';
import AccessibilityScreen from './screens/customer/AccessibilityScreen';
import PersonalizationScreen from './screens/customer/PersonalizationScreen';
import ThemeScreen from './screens/customer/ThemeScreen';
import HelpCenterScreen from './screens/customer/HelpCenterScreen';
import LegalScreen from './screens/customer/LegalScreen';

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
    </Stack.Navigator>
  );
}

// Customer Tab Navigator
function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Cart') iconName = 'shopping-cart';
          else if (route.name === 'WishlistTab') iconName = 'favorite';
          else if (route.name === 'Orders') iconName = 'receipt';
          else if (route.name === 'Profile') iconName = 'person';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Home"
        component={CustomerHomeScreen}
        options={{ title: 'Products' }}
      />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="WishlistTab" component={WishlistScreen} options={{ title: 'Wishlist' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Customer Stack Navigator (Includes Tabs + Detail Screens)
function CustomerStack() {
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
        options={{ title: 'Product Details' }}
      />
      <Stack.Screen
        name="BulkOrders"
        component={BulkOrderScreen}
        options={{ title: 'Bulk Orders' }}
      />
      <Stack.Screen
        name="BulkOrderDetail"
        component={BulkOrderDetailScreen}
        options={{ title: 'Bulk Order Details' }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ title: 'My Wishlist' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{ title: 'My Bookmarks' }}
      />
      <Stack.Screen
        name="Recipes"
        component={RecipesScreen}
        options={{ title: 'Recipes' }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: 'Recipe Details' }}
      />
      <Stack.Screen
        name="Forum"
        component={ForumScreen}
        options={{ title: 'Community Forum' }}
      />
      <Stack.Screen
        name="ForumPostDetail"
        component={ForumPostDetailScreen}
        options={{ title: 'Post Details' }}
      />
      <Stack.Screen
        name="CreateForumPost"
        component={CreateForumPostScreen}
        options={{ title: 'Create Post' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'My Addresses' }} />
      <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} options={{ title: 'Manage Address' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Help & Support' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About Us' }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'My Rewards' }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: 'My Reviews' }} />
      <Stack.Screen name="Refunds" component={RefundsScreen} options={{ title: 'Request Refund' }} />
      <Stack.Screen name="Referral" component={ReferralScreen} options={{ title: 'Refer & Earn' }} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} options={{ title: 'My Subscriptions' }} />
      <Stack.Screen name="Security" component={SecurityScreen} options={{ title: 'Security' }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy' }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ title: 'Language' }} />
      <Stack.Screen name="Accessibility" component={AccessibilityScreen} options={{ title: 'Accessibility' }} />
      <Stack.Screen name="Personalization" component={PersonalizationScreen} options={{ title: 'Personalization' }} />
      <Stack.Screen name="Theme" component={ThemeScreen} options={{ title: 'Theme' }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: 'Help Center' }} />
      <Stack.Screen name="Legal" component={LegalScreen} options={{ title: 'Legal & Policies' }} />
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
        options={{ title: 'Dashboard' }}
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
    // Load user from AsyncStorage
    dispatch(loadUserFromStorage());

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase user is signed in, sync with Redux to ensure fresh token
        console.log('✅ Firebase auth state: User signed in');
        try {
          const token = await firebaseUser.getIdToken();
          const storedUserInfo = await AsyncStorage.getItem('userInfo');

          if (storedUserInfo) {
            const user = JSON.parse(storedUserInfo);
            // Dispatch fresh credentials to Redux
            dispatch(setCredentials({ user, token }));
            console.log('🔄 Redux state updated with fresh Firebase token');
          }
        } catch (error) {
          console.error('Failed to sync Firebase state with Redux:', error);
        }
      } else {
        // Firebase user is signed out
        console.log('ℹ️ Firebase auth state: User signed out');
      }
      // Set auth ready after first check
      dispatch(setAuthReady(true));
    });

    return () => unsubscribe();
  }, []);

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

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
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