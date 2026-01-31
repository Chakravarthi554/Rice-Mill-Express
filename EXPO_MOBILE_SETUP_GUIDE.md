# 📱 Expo Mobile App Integration - Complete Beginner's Guide

## 🎯 Overview

This guide will help you add **Expo mobile apps** (React Native) for **Customer**, **Seller**, and **Delivery Partner** roles to your existing Rice Mill Express e-commerce platform. The mobile apps will share the **same backend**, **same Firebase Authentication**, and **same MongoDB database** as your existing React web app, ensuring everything stays in sync in real-time.

> [!IMPORTANT]
> **Admin remains web-only** - Admin functionality is too complex for mobile and will only be accessible via the React web app.

## 🔐 Critical Architectural Clarifications

> [!WARNING]
> **Please read this carefully to understand the system architecture:**

### Authentication & Database Architecture

1. **Firebase Authentication = ONLY Auth System**
   - Firebase handles **ONLY** user authentication (login/signup/tokens)
   - Email/Password, Phone OTP, and Google Sign-in all go through Firebase
   - Firebase generates ID tokens that the backend verifies
   - **Firebase does NOT store user profiles, orders, or business data**

2. **MongoDB = Single Source of Truth**
   - **ALL business data** lives in MongoDB Atlas:
     - User profiles (name, email, phone, role, KYC status)
     - Orders, products, cart items
     - Delivery partner assignments
     - Seller information, business details
   - MongoDB is the **primary and only database** for application data
   - Every API call reads/writes to MongoDB, not Firestore

3. **Firestore = Lightweight Sync Only**
   - Firestore is used **ONLY** for:
     - Minimal user metadata sync (for Firebase security rules)
     - Real-time presence indicators (optional)
   - **Firestore is NOT the primary database**
   - **Do NOT store orders, products, or business logic in Firestore**
   - Think of it as a "shadow copy" for Firebase-specific features only

4. **Cloudinary = ALL File Uploads**
   - **ALL images and files** go to Cloudinary:
     - Product images
     - User profile pictures
     - Delivery confirmation photos
     - KYC documents
   - **Firebase Storage is NOT used at all**
   - Backend uses Cloudinary SDK for uploads
   - Mobile apps upload to backend API, which then uploads to Cloudinary

### Data Flow Summary

```mermaid
graph LR
    A[Mobile/Web App] -->|Login/Signup| B[Firebase Auth]
    B -->|ID Token| C[Backend API]
    C -->|Verify Token| B
    C -->|Read/Write Data| D[(MongoDB)]
    C -->|Upload Files| E[Cloudinary]
    C -.->|Minimal Sync| F[(Firestore)]
    
    style D fill:#4CAF50,stroke:#2E7D32,stroke-width:3px
    style B fill:#FFA726,stroke:#F57C00
    style E fill:#42A5F5,stroke:#1976D2
    style F fill:#EF5350,stroke:#C62828,stroke-dasharray: 5 5
```

**Legend:**
- **Solid Green (MongoDB)**: Primary database - all business data
- **Orange (Firebase Auth)**: Authentication only
- **Blue (Cloudinary)**: All file storage
- **Dashed Red (Firestore)**: Optional, minimal sync only

---

## 📋 What You Already Have (Current Architecture)

### Backend (Node.js + Express)
- **Server**: Running on `http://localhost:5000`
- **Database**: MongoDB Atlas (cloud-hosted)
- **Authentication**: Firebase Authentication (Email, Phone, Google)
- **File Storage**: Cloudinary (for all images/files)
- **Real-time**: Socket.io for live updates
- **API Routes**: 25+ route files handling orders, products, delivery, etc.

### Frontend (React Web App)
- **Running on**: `http://localhost:3000`
- **Roles Supported**: Customer, Seller, Admin
- **Authentication**: Firebase SDK (Email/Password, Phone OTP, Google Sign-in)
- **State Management**: Redux Toolkit
- **Styling**: Material-UI + Tailwind CSS

### Mobile (Expo - Partially Started)
- **Location**: `c:\Users\udumularahul\Downloads\Rice-Mill-Express\mobile`
- **Current Status**: Basic structure exists with 8 screens
- **What's Missing**: Complete setup, authentication, API integration, role-based navigation

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        WEB[React Web App<br/>Customer, Seller, Admin]
        MOBILE[Expo Mobile App<br/>Customer, Seller, Delivery]
    end
    
    subgraph "Authentication"
        FIREBASE[Firebase Auth<br/>Email, Phone, Google]
    end
    
    subgraph "Backend Layer"
        API[Node.js + Express<br/>Port 5000]
        SOCKET[Socket.io<br/>Real-time Updates]
    end
    
    subgraph "Data Layer"
        MONGO[(MongoDB Atlas<br/>User, Order, Product)]
        CLOUDINARY[Cloudinary<br/>Image Storage]
    end
    
    WEB --> FIREBASE
    MOBILE --> FIREBASE
    FIREBASE --> API
    API --> MONGO
    API --> CLOUDINARY
    API --> SOCKET
    SOCKET --> WEB
    SOCKET --> MOBILE
```

---

## 🚀 Step-by-Step Implementation Guide

### Phase 1: Environment Setup

#### Step 1.1: Install Node.js and Dependencies

**What to do**: Make sure you have the right tools installed.

1. **Check Node.js version** (you need v18 or higher):
   ```bash
   node --version
   ```
   If it's below v18, download from [nodejs.org](https://nodejs.org/)

2. **Install Expo CLI globally**:
   ```bash
   npm install -g expo-cli
   ```

3. **Install EAS CLI** (for building apps):
   ```bash
   npm install -g eas-cli
   ```

4. **Verify installations**:
   ```bash
   expo --version
   eas --version
   ```

#### Step 1.2: Install Expo Go App on Your Phone

**What to do**: Download the Expo Go app to test your mobile app.

- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

This app lets you scan a QR code and instantly see your mobile app running on your phone!

---

### Phase 2: Create the Expo Mobile App

#### Step 2.1: Initialize Expo Project

**What to do**: Set up a new Expo project in the `mobile` folder.

1. **Navigate to your project root**:
   ```bash
   cd c:\Users\udumularahul\Downloads\Rice-Mill-Express
   ```

2. **Remove the existing mobile folder** (we'll recreate it properly):
   ```bash
   rmdir /s mobile
   ```

3. **Create a new Expo app**:
   ```bash
   npx create-expo-app mobile --template blank
   ```
   - Choose **blank** template (TypeScript: No)
   - This creates a clean React Native project

4. **Navigate to mobile folder**:
   ```bash
   cd mobile
   ```

#### Step 2.2: Install Required Dependencies

**What to do**: Install all the packages your mobile app needs.

```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @reduxjs/toolkit react-redux redux-thunk
npm install axios
npm install firebase
npm install @expo/vector-icons
npm install expo-image-picker expo-camera
npm install expo-location
npm install react-native-maps
npm install socket.io-client
npm install @react-native-async-storage/async-storage
npm install react-native-gesture-handler react-native-reanimated
```

**What each package does**:
- `@react-navigation/*`: Navigation between screens (like React Router for mobile)
- `react-redux`: State management (same as web app)
- `axios`: Make API calls to your backend
- `firebase`: Authentication (Email, Phone, Google)
- `expo-image-picker`: Take/upload photos (for delivery confirmation)
- `expo-location`: Get GPS coordinates (for delivery tracking)
- `socket.io-client`: Real-time updates from backend

#### Step 2.3: Configure Firebase for Mobile

**What to do**: Connect your mobile app to the same Firebase project as your web app.

1. **Create `.env` file** in the `mobile` folder:
   ```bash
   # mobile/.env
   EXPO_PUBLIC_API_URL=http://localhost:5000
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBeucVHbAGsjxPqdK7gn4fW8gn_MvfvgLs
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=rice-express-7eef4.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=rice-express-7eef4
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=rice-express-7eef4.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=381785078247
   EXPO_PUBLIC_FIREBASE_APP_ID=1:381785078247:web:5ab1c7a11eac590a1a6542
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-3Z5ZM2LXRK
   ```

   > [!NOTE]
   > These are the **same Firebase credentials** from your `.env` file in the root folder. We're just copying them to the mobile app.

2. **Create Firebase config file** at `mobile/src/config/firebase.js`:
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
   import AsyncStorage from '@react-native-async-storage/async-storage';

   const firebaseConfig = {
     apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
     authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
     storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
     measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
   };

   const app = initializeApp(firebaseConfig);

   // Use AsyncStorage for auth persistence (keeps user logged in)
   const auth = initializeAuth(app, {
     persistence: getReactNativePersistence(AsyncStorage)
   });

   export { auth };
   ```

---

### Phase 3: Set Up Authentication

#### Step 3.1: Create Redux Store

**What to do**: Set up Redux for state management (same pattern as web app).

1. **Create `mobile/src/redux/store.js`**:
   ```javascript
   import { configureStore } from '@reduxjs/toolkit';
   import authReducer from './slices/authSlice';
   import orderReducer from './slices/orderSlice';

   const store = configureStore({
     reducer: {
       auth: authReducer,
       orders: orderReducer,
     },
     middleware: (getDefaultMiddleware) =>
       getDefaultMiddleware({
         serializableCheck: false, // Firebase objects aren't serializable
       }),
   });

   export default store;
   ```

2. **Create `mobile/src/redux/slices/authSlice.js`**:
   ```javascript
   import { createSlice } from '@reduxjs/toolkit';

   const authSlice = createSlice({
     name: 'auth',
     initialState: {
       user: null,
       token: null,
       loading: false,
       error: null,
     },
     reducers: {
       loginStart: (state) => {
         state.loading = true;
         state.error = null;
       },
       loginSuccess: (state, action) => {
         state.loading = false;
         state.user = action.payload.user;
         state.token = action.payload.token;
       },
       loginFailure: (state, action) => {
         state.loading = false;
         state.error = action.payload;
       },
       logout: (state) => {
         state.user = null;
         state.token = null;
       },
     },
   });

   export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
   export default authSlice.reducer;
   ```

#### Step 3.2: Create Authentication Screens

**What to do**: Build login/register screens for mobile.

1. **Create `mobile/src/screens/LoginScreen.js`**:
   ```javascript
   import React, { useState } from 'react';
   import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
   import { signInWithEmailAndPassword } from 'firebase/auth';
   import { useDispatch } from 'react-redux';
   import axios from 'axios';
   import { auth } from '../config/firebase';
   import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';

   export default function LoginScreen({ navigation }) {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const dispatch = useDispatch();

     const handleLogin = async () => {
       try {
         dispatch(loginStart());

         // 1. Sign in with Firebase
         const userCredential = await signInWithEmailAndPassword(auth, email, password);
         const idToken = await userCredential.user.getIdToken();

         // 2. Send token to backend to get user profile
         const response = await axios.post(
           `${process.env.EXPO_PUBLIC_API_URL}/api/auth/firebase-login`,
           { idToken }
         );

         // 3. Save user data to Redux
         dispatch(loginSuccess({
           user: response.data,
           token: idToken,
         }));

         Alert.alert('Success', 'Logged in successfully!');
       } catch (error) {
         dispatch(loginFailure(error.message));
         Alert.alert('Login Failed', error.message);
       }
     };

     return (
       <View style={styles.container}>
         <Text style={styles.title}>Rice Mill Express</Text>
         
         <TextInput
           style={styles.input}
           placeholder="Email"
           value={email}
           onChangeText={setEmail}
           autoCapitalize="none"
           keyboardType="email-address"
         />
         
         <TextInput
           style={styles.input}
           placeholder="Password"
           value={password}
           onChangeText={setPassword}
           secureTextEntry
         />
         
         <TouchableOpacity style={styles.button} onPress={handleLogin}>
           <Text style={styles.buttonText}>Login</Text>
         </TouchableOpacity>
         
         <TouchableOpacity onPress={() => navigation.navigate('Register')}>
           <Text style={styles.link}>Don't have an account? Register</Text>
         </TouchableOpacity>
       </View>
     );
   }

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       justifyContent: 'center',
       padding: 20,
       backgroundColor: '#fff',
     },
     title: {
       fontSize: 28,
       fontWeight: 'bold',
       textAlign: 'center',
       marginBottom: 40,
       color: '#4CAF50',
     },
     input: {
       borderWidth: 1,
       borderColor: '#ddd',
       padding: 15,
       marginBottom: 15,
       borderRadius: 8,
       fontSize: 16,
     },
     button: {
       backgroundColor: '#4CAF50',
       padding: 15,
       borderRadius: 8,
       marginTop: 10,
     },
     buttonText: {
       color: '#fff',
       textAlign: 'center',
       fontSize: 18,
       fontWeight: 'bold',
     },
     link: {
       color: '#4CAF50',
       textAlign: 'center',
       marginTop: 20,
       fontSize: 16,
     },
   });
   ```

---

### Phase 4: Role-Based Navigation

#### Step 4.1: Understanding Roles

**Your app has 4 roles**:

| Role | Access | Mobile App? |
|------|--------|-------------|
| **customer** | Browse products, place orders, track deliveries | ✅ Yes |
| **seller** | Manage products, view orders, assign delivery partners | ✅ Yes |
| **deliveryPartner** | View assigned orders, update delivery status, upload photos | ✅ Yes |
| **admin** | Manage everything (users, orders, settings, moderation) | ❌ No (web only) |

#### Step 4.2: Create Role-Based Navigation

**What to do**: Show different screens based on user role.

1. **Create `mobile/src/navigation/AppNavigator.js`**:
   ```javascript
   import React from 'react';
   import { createStackNavigator } from '@react-navigation/stack';
   import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
   import { MaterialIcons } from '@expo/vector-icons';
   import { useSelector } from 'react-redux';

   // Auth Screens
   import LoginScreen from '../screens/LoginScreen';
   import RegisterScreen from '../screens/RegisterScreen';

   // Customer Screens
   import CustomerHomeScreen from '../screens/customer/HomeScreen';
   import ProductDetailScreen from '../screens/customer/ProductDetailScreen';
   import CartScreen from '../screens/customer/CartScreen';
   import OrdersScreen from '../screens/customer/OrdersScreen';

   // Seller Screens
   import SellerDashboardScreen from '../screens/seller/DashboardScreen';
   import SellerProductsScreen from '../screens/seller/ProductsScreen';
   import SellerOrdersScreen from '../screens/seller/OrdersScreen';

   // Delivery Partner Screens
   import DeliveryDashboardScreen from '../screens/delivery/DashboardScreen';
   import DeliveryOrderDetailScreen from '../screens/delivery/OrderDetailScreen';
   import DeliveryConfirmationScreen from '../screens/delivery/ConfirmationScreen';

   const Stack = createStackNavigator();
   const Tab = createBottomTabNavigator();

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
         <Tab.Screen name="Home" component={CustomerHomeScreen} />
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
             else if (route.name === 'Products') iconName = 'inventory';
             else if (route.name === 'Orders') iconName = 'receipt-long';
             else if (route.name === 'Profile') iconName = 'person';
             return <MaterialIcons name={iconName} size={size} color={color} />;
           },
           tabBarActiveTintColor: '#4CAF50',
           tabBarInactiveTintColor: 'gray',
         })}
       >
         <Tab.Screen name="Dashboard" component={SellerDashboardScreen} />
         <Tab.Screen name="Products" component={SellerProductsScreen} />
         <Tab.Screen name="Orders" component={SellerOrdersScreen} />
         <Tab.Screen name="Profile" component={ProfileScreen} />
       </Tab.Navigator>
     );
   }

   // Delivery Partner Stack Navigator
   function DeliveryStack() {
     return (
       <Stack.Navigator>
         <Stack.Screen name="Dashboard" component={DeliveryDashboardScreen} />
         <Stack.Screen name="OrderDetail" component={DeliveryOrderDetailScreen} />
         <Stack.Screen name="Confirmation" component={DeliveryConfirmationScreen} />
       </Stack.Navigator>
     );
   }

   // Main App Navigator
   export default function AppNavigator() {
     const { user } = useSelector((state) => state.auth);

     if (!user) {
       // Not logged in - show auth screens
       return (
         <Stack.Navigator screenOptions={{ headerShown: false }}>
           <Stack.Screen name="Login" component={LoginScreen} />
           <Stack.Screen name="Register" component={RegisterScreen} />
         </Stack.Navigator>
       );
     }

     // Logged in - show role-based screens
     if (user.role === 'customer') {
       return <CustomerTabs />;
     } else if (user.role === 'seller') {
       return <SellerTabs />;
     } else if (user.role === 'deliveryPartner') {
       return <DeliveryStack />;
     } else if (user.role === 'admin') {
       // Admin not supported on mobile
       return (
         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
           <Text>Admin access is only available on web.</Text>
           <TouchableOpacity onPress={() => dispatch(logout())}>
             <Text style={{ color: '#4CAF50', marginTop: 20 }}>Logout</Text>
           </TouchableOpacity>
         </View>
       );
     }
   }
   ```

---

### Phase 5: API Integration

#### Step 5.1: Create API Service

**What to do**: Create a centralized service to make API calls to your backend.

1. **Create `mobile/src/services/api.js`**:
   ```javascript
   import axios from 'axios';
   import { auth } from '../config/firebase';

   const API_URL = process.env.EXPO_PUBLIC_API_URL;

   // Create axios instance
   const api = axios.create({
     baseURL: API_URL,
     headers: {
       'Content-Type': 'application/json',
     },
   });

   // Add auth token to every request
   api.interceptors.request.use(
     async (config) => {
       const user = auth.currentUser;
       if (user) {
         const token = await user.getIdToken();
         config.headers.Authorization = `Bearer ${token}`;
       }
       return config;
     },
     (error) => Promise.reject(error)
   );

   // API methods
   export const apiService = {
     // Products
     getProducts: () => api.get('/api/products'),
     getProductById: (id) => api.get(`/api/products/${id}`),

     // Orders
     getOrders: () => api.get('/api/orders'),
     createOrder: (orderData) => api.post('/api/orders', orderData),
     getOrderById: (id) => api.get(`/api/orders/${id}`),

     // Cart
     getCart: () => api.get('/api/cart'),
     addToCart: (productId, quantity) => api.post('/api/cart', { productId, quantity }),
     updateCartItem: (productId, quantity) => api.put('/api/cart', { productId, quantity }),
     removeFromCart: (productId) => api.delete(`/api/cart/${productId}`),

     // Delivery Partner
     getAssignedOrders: () => api.get('/api/dp/assigned-orders'),
     updateDeliveryStatus: (orderId, status) => api.put(`/api/dp/orders/${orderId}/status`, { status }),
     uploadDeliveryPhoto: (orderId, photoData) => api.post(`/api/delivery/confirm/${orderId}`, photoData),

     // Seller
     getSellerOrders: () => api.get('/api/seller/orders'),
     getSellerProducts: () => api.get('/api/seller/products'),
     assignDeliveryPartner: (orderId, partnerId) => 
       api.put(`/api/delivery-partners/orders/${orderId}`, { partnerId }),
   };

   export default api;
   ```

#### Step 5.2: Connect Backend to Mobile

**What to do**: Update backend CORS to allow mobile app connections.

1. **Edit `backend/server.js`** (around line 91):
   ```javascript
   // Enhanced CORS setup
   app.use(
     cors({
       origin: [
         "http://localhost:3000",      // React web app
         "http://127.0.0.1:3000",
         "http://localhost:3001",
         "exp://192.168.*.*:8081",     // Expo mobile app (local network)
         "http://192.168.*.*:8081",    // Expo mobile app (alternative)
       ],
       credentials: true,
       methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
       allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
       exposedHeaders: ["Authorization"],
     })
   );
   ```

   > [!NOTE]
   > The `192.168.*.*` pattern allows connections from your phone on the same WiFi network.

2. **Find your computer's local IP address**:
   - **Windows**: Open Command Prompt and run `ipconfig`, look for "IPv4 Address"
   - **Mac/Linux**: Run `ifconfig | grep inet`
   - Example: `192.168.1.100`

3. **Update mobile `.env` file** with your local IP:
   ```bash
   # Replace localhost with your computer's IP address
   EXPO_PUBLIC_API_URL=http://192.168.1.100:5000
   ```

---

### Phase 6: Delivery Partner Mobile Features

#### Step 6.1: Photo Confirmation Screen

**What to do**: Allow delivery partners to take photos to confirm delivery.

1. **Create `mobile/src/screens/delivery/ConfirmationScreen.js`**:
   ```javascript
   import React, { useState } from 'react';
   import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
   import * as ImagePicker from 'expo-image-picker';
   import { apiService } from '../../services/api';

   export default function DeliveryConfirmationScreen({ route, navigation }) {
     const { orderId } = route.params;
     const [photo, setPhoto] = useState(null);
     const [uploading, setUploading] = useState(false);

     const takePhoto = async () => {
       // Request camera permission
       const { status } = await ImagePicker.requestCameraPermissionsAsync();
       if (status !== 'granted') {
         Alert.alert('Permission Denied', 'Camera access is required');
         return;
       }

       // Launch camera
       const result = await ImagePicker.launchCameraAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
         quality: 0.7,
         base64: true,
       });

       if (!result.canceled) {
         setPhoto(result.assets[0]);
       }
     };

     const uploadPhoto = async () => {
       if (!photo) {
         Alert.alert('Error', 'Please take a photo first');
         return;
       }

       try {
         setUploading(true);

         // Convert image to base64 and upload
         const formData = new FormData();
         formData.append('photo', {
           uri: photo.uri,
           type: 'image/jpeg',
           name: `delivery_${orderId}.jpg`,
         });

         await apiService.uploadDeliveryPhoto(orderId, formData);

         Alert.alert('Success', 'Delivery confirmed!', [
           { text: 'OK', onPress: () => navigation.goBack() }
         ]);
       } catch (error) {
         Alert.alert('Upload Failed', error.message);
       } finally {
         setUploading(false);
       }
     };

     return (
       <View style={styles.container}>
         <Text style={styles.title}>Delivery Confirmation</Text>
         <Text style={styles.subtitle}>Order #{orderId}</Text>

         {photo ? (
           <Image source={{ uri: photo.uri }} style={styles.preview} />
         ) : (
           <View style={styles.placeholder}>
             <Text style={styles.placeholderText}>No photo taken</Text>
           </View>
         )}

         <TouchableOpacity style={styles.button} onPress={takePhoto}>
           <Text style={styles.buttonText}>
             {photo ? 'Retake Photo' : 'Take Photo'}
           </Text>
         </TouchableOpacity>

         {photo && (
           <TouchableOpacity 
             style={[styles.button, styles.uploadButton]} 
             onPress={uploadPhoto}
             disabled={uploading}
           >
             <Text style={styles.buttonText}>
               {uploading ? 'Uploading...' : 'Confirm Delivery'}
             </Text>
           </TouchableOpacity>
         )}
       </View>
     );
   }

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       padding: 20,
       backgroundColor: '#fff',
     },
     title: {
       fontSize: 24,
       fontWeight: 'bold',
       marginBottom: 10,
     },
     subtitle: {
       fontSize: 16,
       color: '#666',
       marginBottom: 30,
     },
     preview: {
       width: '100%',
       height: 300,
       borderRadius: 10,
       marginBottom: 20,
     },
     placeholder: {
       width: '100%',
       height: 300,
       backgroundColor: '#f0f0f0',
       borderRadius: 10,
       justifyContent: 'center',
       alignItems: 'center',
       marginBottom: 20,
     },
     placeholderText: {
       color: '#999',
       fontSize: 16,
     },
     button: {
       backgroundColor: '#4CAF50',
       padding: 15,
       borderRadius: 8,
       marginBottom: 10,
     },
     uploadButton: {
       backgroundColor: '#2196F3',
     },
     buttonText: {
       color: '#fff',
       textAlign: 'center',
       fontSize: 18,
       fontWeight: 'bold',
     },
   });
   ```

---

### Phase 7: Real-Time Sync with Socket.io

#### Step 7.1: Set Up Socket Connection

**What to do**: Connect mobile app to Socket.io for real-time order updates.

1. **Create `mobile/src/services/socket.js`**:
   ```javascript
   import { io } from 'socket.io-client';
   import { auth } from '../config/firebase';

   let socket = null;

   export const connectSocket = async () => {
     const user = auth.currentUser;
     if (!user) return;

     const token = await user.getIdToken();

     socket = io(process.env.EXPO_PUBLIC_API_URL, {
       auth: { token },
       transports: ['websocket'],
     });

     socket.on('connect', () => {
       console.log('✅ Socket connected:', socket.id);
     });

     socket.on('disconnect', () => {
       console.log('❌ Socket disconnected');
     });

     return socket;
   };

   export const disconnectSocket = () => {
     if (socket) {
       socket.disconnect();
       socket = null;
     }
   };

   export const subscribeToOrderUpdates = (callback) => {
     if (!socket) return;
     socket.on('ORDER_UPDATE', callback);
   };

   export const subscribeToDeliveryAssignment = (callback) => {
     if (!socket) return;
     socket.on('ORDER_ASSIGNED', callback);
   };

   export const getSocket = () => socket;
   ```

2. **Use Socket in Delivery Dashboard**:
   ```javascript
   import { useEffect } from 'react';
   import { connectSocket, subscribeToDeliveryAssignment } from '../../services/socket';

   export default function DeliveryDashboardScreen() {
     useEffect(() => {
       // Connect to socket when screen loads
       connectSocket();

       // Listen for new order assignments
       subscribeToDeliveryAssignment((order) => {
         Alert.alert('New Order Assigned!', `Order #${order._id}`);
         // Refresh orders list
         fetchOrders();
       });

       return () => {
         disconnectSocket();
       };
     }, []);

     // ... rest of component
   }
   ```

---

### Phase 8: Testing and Running

#### Step 8.1: Start Backend Server

**What to do**: Make sure your backend is running.

```bash
cd c:\Users\udumularahul\Downloads\Rice-Mill-Express\backend
npm run dev
```

You should see:
```
✅ MongoDB Connected
🚀 Server running on http://localhost:5000
```

#### Step 8.2: Start Mobile App

**What to do**: Run the Expo development server.

```bash
cd c:\Users\udumularahul\Downloads\Rice-Mill-Express\mobile
npx expo start
```

You'll see a QR code in the terminal. Scan it with:
- **Android**: Expo Go app
- **iOS**: Camera app (opens in Expo Go)

#### Step 8.3: Test Authentication Flow

**What to do**: Test login on mobile.

1. Open the app on your phone
2. Try logging in with existing credentials from your web app
3. Verify you see the correct role-based screens:
   - **Customer**: Home, Cart, Orders, Profile tabs
   - **Seller**: Dashboard, Products, Orders, Profile tabs
   - **Delivery Partner**: Dashboard with assigned orders

#### Step 8.4: Test API Connectivity

**What to do**: Verify mobile app can talk to backend.

1. **Check network connection**:
   - Make sure phone and computer are on the same WiFi
   - Verify `EXPO_PUBLIC_API_URL` uses your computer's IP (not `localhost`)

2. **Test API call**:
   - Navigate to Products screen
   - Products should load from backend
   - If you see errors, check backend logs

3. **Test real-time updates**:
   - Open web app and mobile app side-by-side
   - Create an order on web
   - Verify it appears on mobile instantly (via Socket.io)

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Network request failed"

**Problem**: Mobile app can't connect to backend.

**Solution**:
1. Check your computer's IP address: `ipconfig` (Windows) or `ifconfig` (Mac)
2. Update `EXPO_PUBLIC_API_URL` in `mobile/.env`
3. Make sure backend CORS allows your IP
4. Disable Windows Firewall temporarily to test

### Issue 2: "Firebase auth/invalid-api-key"

**Problem**: Firebase credentials are wrong.

**Solution**:
1. Double-check `.env` file has correct Firebase config
2. Make sure you're using `EXPO_PUBLIC_` prefix (not `REACT_APP_`)
3. Restart Expo server after changing `.env`

### Issue 3: Camera not working

**Problem**: Photo confirmation screen crashes.

**Solution**:
1. Check camera permissions in phone settings
2. For Android: Add to `app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-camera",
           {
             "cameraPermission": "Allow app to access your camera"
           }
         ]
       ]
     }
   }
   ```

### Issue 4: "User role not authorized"

**Problem**: Backend rejects API calls.

**Solution**:
1. Check Firebase token is being sent in Authorization header
2. Verify user role in MongoDB matches expected role
3. Check backend logs for authorization errors

---

## 📦 Deployment Readiness Checklist

Before deploying to production:

- [ ] **Environment Variables**: Create production `.env` with real API URL
- [ ] **Firebase**: Set up production Firebase project (separate from dev)
- [ ] **Backend**: Deploy backend to cloud (Heroku, AWS, DigitalOcean)
- [ ] **CORS**: Update backend CORS to allow production mobile app domain
- [ ] **Build Mobile App**:
  ```bash
  eas build --platform android
  eas build --platform ios
  ```
- [ ] **Test on Real Devices**: Test on multiple Android/iOS devices
- [ ] **App Store Setup**:
  - Create Google Play Developer account ($25 one-time)
  - Create Apple Developer account ($99/year)
  - Submit apps for review

---

## 🎓 Key Concepts Explained (For Beginners)

### What is Firebase Authentication?

Firebase handles user login/signup for you. Instead of building your own auth system, you use Firebase's pre-built system. It supports:
- **Email/Password**: Traditional login
- **Phone OTP**: SMS verification code
- **Google Sign-in**: "Sign in with Google" button

Your backend verifies Firebase tokens to confirm users are who they say they are.

### What is Role-Based Access Control (RBAC)?

Different users see different features based on their "role":
- **Customer**: Can browse and buy products
- **Seller**: Can add products and manage orders
- **Delivery Partner**: Can only see assigned deliveries
- **Admin**: Can do everything (web only)

The backend checks the user's role before allowing API actions.

### How Does Real-Time Sync Work?

**Socket.io** creates a persistent connection between your app and server. When something changes (new order, status update), the server instantly "pushes" the update to all connected devices. No need to refresh!

### Why Use Redux?

Redux stores app data (user info, cart items, orders) in one central place. All screens can access this data without passing it around manually. Think of it as a "global variable" that's organized and safe.

---

## 📚 Next Steps

1. **Implement Missing Screens**: Create all customer/seller/delivery screens
2. **Add Push Notifications**: Use Expo Notifications for order alerts
3. **Offline Support**: Cache data with AsyncStorage for offline viewing
4. **Payment Integration**: Add Razorpay/Stripe mobile SDKs
5. **Location Tracking**: Real-time delivery partner location on map

---

## 🆘 Getting Help

If you get stuck:

1. **Check Backend Logs**: Look at terminal running `npm run dev`
2. **Check Mobile Logs**: Look at Expo terminal for errors
3. **Use Expo Debugger**: Shake phone → "Debug Remote JS"
4. **Firebase Console**: Check if users are being created
5. **MongoDB Atlas**: Verify data is being saved

---

## 📝 Summary

You now have:
- ✅ Expo mobile app connected to existing backend
- ✅ Firebase authentication shared between web and mobile
- ✅ Role-based navigation (Customer, Seller, Delivery Partner)
- ✅ API integration with backend
- ✅ Real-time updates via Socket.io
- ✅ Photo upload for delivery confirmation
- ✅ Same MongoDB database for all platforms

**Everything stays in sync** - web and mobile share the same backend, auth, and database!
