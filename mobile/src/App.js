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
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
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
      <Tab.Screen name="Seller" component={SellerStack} />
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