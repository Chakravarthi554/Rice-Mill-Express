import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import store from './redux/store';

// Import screens
import BulkOrderScreen from './screens/BulkOrderScreen';
import BulkOrderDetailScreen from './screens/BulkOrderDetailScreen';
import ProductScreen from './screens/ProductScreen';
import SellerScreen from './screens/SellerScreen';
import SellerKyCScreen from './screens/SellerKyCScreen';
import AddDeliveryPartnerScreen from './screens/AddDeliveryPartnerScreen'; // New Import
import DeliveryPartnerDashboard from './screens/DeliveryPartnerDashboard';
import DeliveryConfirmationScreen from './screens/DeliveryConfirmationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bulk Order Stack Navigator
function BulkOrderStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BulkOrders"
        component={BulkOrderScreen}
        options={{ title: 'Bulk Orders' }}
      />
      <Stack.Screen
        name="BulkOrderDetail"
        component={BulkOrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
    </Stack.Navigator>
  );
}

// Seller Stack Navigator
function SellerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SellerDashboard"
        component={SellerScreen}
        options={{ title: 'Seller Dashboard' }}
      />
      <Stack.Screen
        name="SellerKYC"
        component={SellerKyCScreen}
        options={{ title: 'KYC Application' }}
      />
      <Stack.Screen
        name="AddDeliveryPartner"
        component={AddDeliveryPartnerScreen}
        options={{ title: 'Register Delivery Partner' }}
      />
    </Stack.Navigator>
  );
}

// NEW: Delivery Stack Navigator
function DeliveryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DeliveryDashboard"
        component={DeliveryPartnerDashboard}
        options={{ title: 'Delivery Partner Dashboard' }}
      />
      <Stack.Screen
        name="DeliveryConfirmation"
        component={DeliveryConfirmationScreen}
        options={{ title: 'Photo Confirmation' }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  const { userInfo } = useSelector(state => state.userLogin);
  const role = userInfo?.role;

  // If role is deliveryPartner, show a simplified dashboard
  if (role === 'deliveryPartner' || role === 'delivery_partner') {
    return <DeliveryStack />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Products') iconName = 'store';
          else if (route.name === 'Bulk Orders') iconName = 'shopping-cart';
          else if (route.name === 'Seller') iconName = 'storefront';

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: '#4CAF50',
        inactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen name="Products" component={ProductScreen} />
      <Tab.Screen name="Bulk Orders" component={BulkOrderStack} />
      {role === 'seller' && (
        <Tab.Screen name="Seller" component={SellerStack} />
      )}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </Provider>
  );
}