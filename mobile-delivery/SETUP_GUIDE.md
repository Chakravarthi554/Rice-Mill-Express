# Expo Mobile App - Installation and Setup Guide

## Prerequisites

Before starting, ensure you have:
- ✅ Node.js v22.18.0 (installed)
- ✅ Local IP: 10.65.213.143 (configured in `.env`)
- 📱 Expo Go app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))

## Installation Steps

### 1. Enable PowerShell Script Execution (Windows)

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Install Expo CLI Globally

```bash
npm install -g expo-cli eas-cli
```

### 3. Install Mobile App Dependencies

Navigate to the mobile directory and install dependencies:

```bash
cd c:\Users\welcome\Desktop\rice-mill-app\mobile
npm install
```

This will install all required packages including:
- React Navigation (navigation)
- Redux Toolkit (state management)
- Firebase (authentication)
- Axios (API calls)
- Socket.io (real-time updates)
- Expo Camera & Location (delivery features)

### 4. Verify Installation

Check that Expo CLI is installed:

```bash
expo --version
```

## Running the Mobile App

### Start Backend Server (Terminal 1)

```bash
cd c:\Users\welcome\Desktop\rice-mill-app\backend
npm run dev
```

You should see:
```
✅ MongoDB Connected
🚀 Server running on http://localhost:5000
```

### Start Mobile App (Terminal 2)

```bash
cd c:\Users\welcome\Desktop\rice-mill-app\mobile
npx expo start
```

You'll see a QR code in the terminal.

### Connect Your Phone

1. **Make sure your phone and computer are on the same WiFi network**
2. Open Expo Go app on your phone
3. **Android**: Scan QR code with Expo Go app
4. **iOS**: Scan QR code with Camera app (opens in Expo Go)

## Testing the App

### Test Authentication

1. Open the app on your phone
2. You'll see the login screen
3. Try logging in with existing credentials from your web app
4. Or register a new account with role selection (Customer/Seller/Delivery Partner)

### Test Role-Based Navigation

**Customer Role:**
- Home tab (product listing with search)
- Cart tab (add/remove items)
- Orders tab (view orders with real-time updates)
- Profile tab (user info and logout)

**Seller Role:**
- Dashboard tab (seller dashboard)
- Bulk Orders tab (bulk order management)
- Profile tab

**Delivery Partner Role:**
- Delivery Dashboard (assigned orders)
- Photo Confirmation (camera for delivery proof)

**Admin Role:**
- Shows message: "Admin access is only available on web"

## Troubleshooting

### "Network request failed"

**Problem**: Mobile app can't connect to backend

**Solution**:
1. Verify your computer's IP: `ipconfig` (should be 10.65.213.143)
2. Check `mobile/.env` has correct IP: `EXPO_PUBLIC_API_URL=http://10.65.213.143:5000`
3. Ensure phone and computer are on same WiFi
4. Check Windows Firewall isn't blocking port 5000

### "Firebase auth/invalid-api-key"

**Problem**: Firebase credentials are incorrect

**Solution**:
1. Check `mobile/.env` has correct Firebase config
2. Restart Expo server: `Ctrl+C` then `npx expo start` again

### PowerShell Script Execution Error

**Problem**: "running scripts is disabled on this system"

**Solution**:
Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Camera Not Working

**Problem**: Camera permission denied

**Solution**:
1. Check phone settings → Apps → Expo Go → Permissions → Camera (enable)
2. Restart the app

## What's Been Implemented

✅ **Environment Configuration**
- `.env` file with local IP and Firebase credentials
- `app.json` with camera/location permissions
- `package.json` with all dependencies

✅ **Firebase Authentication**
- Login/Register screens
- AsyncStorage persistence (stay logged in)
- Backend integration

✅ **Redux Store**
- Modern Redux Toolkit setup
- Auth slice with login/register/logout
- AsyncStorage integration

✅ **API Service**
- Centralized API service with auth interceptor
- Methods for products, orders, cart, delivery, seller
- Error handling

✅ **Socket.io Service**
- Real-time updates for orders
- Delivery assignment notifications
- Reconnection logic

✅ **Customer Screens**
- Home (product listing with search)
- Cart (add/remove/update items)
- Orders (real-time status updates)
- Profile (user info and logout)

✅ **Role-Based Navigation**
- Customer: Home, Cart, Orders, Profile tabs
- Seller: Dashboard, Bulk Orders, Profile tabs
- Delivery Partner: Dashboard, Confirmation screens
- Admin: Restriction message (web-only)

✅ **Backend Updates**
- CORS updated to allow mobile connections
- Supports local network (10.65.213.143 and 192.168.x.x)

## Next Steps

After successful installation and testing:

1. **Test on your phone**: Login and navigate through different roles
2. **Test real-time updates**: Create an order on web, see it appear on mobile instantly
3. **Test delivery features**: Use camera for delivery confirmation
4. **Report any issues**: Check console logs for errors

## File Structure

```
mobile/
├── .env                          # Environment variables
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── src/
│   ├── App.js                    # Main app with navigation
│   ├── config/
│   │   └── firebase.js           # Firebase setup
│   ├── redux/
│   │   ├── store.js              # Redux store
│   │   └── slices/
│   │       └── authSlice.js      # Auth state management
│   ├── services/
│   │   ├── api.js                # API service
│   │   └── socket.js             # Socket.io service
│   └── screens/
│       ├── auth/                 # Login, Register
│       ├── customer/             # Home, Cart, Orders
│       ├── seller/               # (existing screens)
│       ├── delivery/             # (existing screens)
│       └── shared/               # Profile
```

## Support

If you encounter any issues:
1. Check backend logs (Terminal 1)
2. Check Expo logs (Terminal 2)
3. Check phone console (shake phone → "Debug Remote JS")
4. Verify Firebase console for auth issues
5. Check MongoDB Atlas for data issues
