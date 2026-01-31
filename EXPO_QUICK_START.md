# 📱 Expo Mobile App - Quick Start

## ⚡ Quick Commands

### First Time Setup
```bash
# 1. Install Expo CLI
npm install -g expo-cli eas-cli

# 2. Navigate to mobile folder
cd c:\Users\udumularahul\Downloads\Rice-Mill-Express\mobile

# 3. Install dependencies
npm install

# 4. Start development server
npx expo start
```

### Daily Development
```bash
# Start backend (Terminal 1)
cd c:\Users\udumularahul\Downloads\Rice-Mill-Express\backend
npm run dev

# Start mobile app (Terminal 2)
cd c:\Users\udumularahul\Downloads\Rice-Mill-Express\mobile
npx expo start
```

## 🏗️ Architecture Summary

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Authentication** | Login/Signup/Tokens | Firebase Auth (Email, Phone, Google) |
| **Primary Database** | ALL business data | MongoDB Atlas |
| **File Storage** | ALL images/files | Cloudinary |
| **Real-time Sync** | Live updates | Socket.io |
| **Optional Sync** | Firebase rules only | Firestore (minimal) |

## 🔑 Key Points

✅ **Firebase Auth** = Authentication ONLY (no data storage)  
✅ **MongoDB** = Single source of truth for ALL data  
✅ **Cloudinary** = ALL file uploads (no Firebase Storage)  
✅ **Firestore** = Optional, minimal sync only (NOT primary DB)  

## 📱 Supported Roles

| Role | Mobile Support | Features |
|------|----------------|----------|
| Customer | ✅ Yes | Browse, order, track deliveries |
| Seller | ✅ Yes | Manage products, orders, delivery partners |
| Delivery Partner | ✅ Yes | View orders, update status, photo confirmation |
| Admin | ❌ No | Web-only (too complex for mobile) |

## 🔗 Important Files

- **Full Guide**: `EXPO_MOBILE_SETUP_GUIDE.md` (this directory)
- **Mobile App**: `mobile/` folder
- **Backend**: `backend/` folder
- **Web App**: `frontend/` folder

## 🆘 Troubleshooting

### Can't connect to backend?
1. Get your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac)
2. Update `mobile/.env`: `EXPO_PUBLIC_API_URL=http://YOUR_IP:5000`
3. Make sure phone and computer are on same WiFi

### Firebase errors?
1. Check `mobile/.env` has correct Firebase credentials
2. Use `EXPO_PUBLIC_` prefix (not `REACT_APP_`)
3. Restart Expo server after changing `.env`

### Camera not working?
1. Check phone permissions in Settings
2. Add camera plugin to `app.json`

## 📚 Next Steps

1. Read the full guide: `EXPO_MOBILE_SETUP_GUIDE.md`
2. Follow Phase 1: Environment Setup
3. Follow Phase 2: Create Expo App
4. Follow Phase 3: Set Up Authentication
5. Test on your phone with Expo Go app

---

**For detailed step-by-step instructions, see `EXPO_MOBILE_SETUP_GUIDE.md`**
