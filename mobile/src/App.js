import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import store from './redux/store';
import { loadUserFromStorage } from './redux/slices/authSlice';

// Auth Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';

// Customer Screens
import CustomerHomeScreen from './screens/customer/HomeScreen';
import CartScreen from './screens/customer/CartScreen';
import OrdersScreen from './screens/customer/OrdersScreen';

// Seller Screens (existing)
import SellerScreen from './screens/SellerScreen';
import SellerKycScreen from './screens/SellerKycScreen';
import AddDeliveryPartnerScreen from './screens/AddDeliveryPartnerScreen';

// Delivery Partner Screens (existing)
import DeliveryPartnerDashboard from './screens/DeliveryPartnerDashboard';
import DeliveryConfirmationScreen from './screens/DeliveryConfirmationScreen';

// Shared Screens
import ProfileScreen from './screens/shared/ProfileScreen';

// Bulk Order Screens (existing) - TEMPORARILY DISABLED DUE TO MISSING REDUX ACTIONS
// import BulkOrderScreen from './screens/BulkOrderScreen';
// import BulkOrderDetailScreen from './screens/BulkOrderDetailScreen';

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
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
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

// Delivery Partner Stack Navigator
function DeliveryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DeliveryDashboard"
        component={DeliveryPartnerDashboard}
        options={{ title: 'My Deliveries' }}
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
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, []);

  if (loading) {
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
    return <CustomerTabs />;
  } else if (role === 'seller') {
    return <SellerTabs />;
  } else if (role === 'deliverypartner' || role === 'delivery_partner') {
    return <DeliveryStack />;
  } else if (role === 'admin') {
    return <AdminRestrictionScreen />;
  }

  // Fallback to customer if role is unknown
  return <CustomerTabs />;
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