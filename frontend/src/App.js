import React, { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  useMediaQuery,
  CssBaseline,
} from '@mui/material';
import { useSelector } from 'react-redux';

import { ThemeProvider as CustomThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/i18nContext';
import ProtectedRoute from './components/common/RoleRoute';
import SocketInitializer from './components/common/SocketInitializer';
import './theme.css';

// --- Pages ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CustomerDashboard from './pages/CustomerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SellerKycPage from './pages/seller/SellerKycPage';
import AdminForumPanel from './components/admin/AdminForumPanel';
import ProductPage from './pages/customer/ProductPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';
import BulkOrderPage from './pages/customer/BulkOrderPage';
import CartPage from './pages/customer/CartPage';
import WishlistPage from './pages/customer/WishlistPage';
import NotificationsPage from './pages/customer/NotificationsPage';
import DeliveryKYCApproval from './components/admin/DeliveryKYCApproval';
import OrderSuccessPage from './pages/customer/OrderSuccessPage';
import VerifyEmailNotice from './pages/VerifyEmailNotice';



// --- Replacement Components ---
import ReplacementManagement from './components/admin/ReplacementManagement';

import AccountManagement from './components/customer/AccountManagement';
import LogoutPage from './components/customer/LogoutPage';
import DeleteAccountPage from './components/customer/DeleteAccountPage';

// --- Community ---
import RecipeDetail from './components/common/RecipeDetail';
import RecipeList from './components/common/RecipeList';
import ForumList from './components/common/ForumList';
import ForumPostDetail from './components/common/ForumPostDetail';
import CreatePostForm from './components/common/CreatePostForm';
import ForumComments from './components/common/ForumComments';
import BookmarksPage from './pages/customer/BookmarksPage';

// --- Settings Components ---
import Settings from './components/customer/Settings';
import Profile from './components/customer/Profile';
import AddressManager from './components/customer/AddressManager';
import SecuritySettings from './components/customer/SecuritySettings';
import PreferencesSettings from './components/customer/PreferencesSettings';


// REAL Components (NOT placeholders)
import LanguageSettings from './components/customer/LanguageSettings';
import ThemeMode from './components/customer/ThemeMode';
import AccessibilitySettings from './components/customer/AccessibilitySettings';
import OrderHistory from './components/customer/MyOrders';
import RefundsReturns from './components/customer/RefundsReturns';
import DownloadInvoices from './components/customer/DownloadInvoices';
import RewardsWallet from './components/customer/RewardsWallet';
import Recommendations from './components/customer/Recommendations';
import PrivacySettings from './components/customer/PrivacySettings';
import HelpCenter from './components/customer/HelpCenter';
import LegalPolicies from './components/customer/LegalPolicies';
import ContactForm from './components/customer/ContactForm';
import NotificationSettings from './components/customer/NotificationSettings';
import Reviews from './components/customer/Reviews';
import About from './components/customer/About';
import Bookmarks from './components/customer/Bookmarks';

// Placeholder for future
import SettingsPlaceholder from './components/customer/SettingsPlaceholder';

// ============================================================
// THEME CONFIGURATION
// ============================================================
const getAppTheme = (mode) => {
  const lightPalette = {
    primary: { main: '#166534' },
    secondary: { main: '#F97316' },
    success: { main: '#16A34A' },
    warning: { main: '#F59E0B' },
    background: { default: '#F4F7F2', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#6B7280' },
  };
  const darkPalette = {
    mode: 'dark',
    primary: { main: '#4ADE80' },
    secondary: { main: '#FB923C' },
    success: { main: '#22C55E' },
    warning: { main: '#FBBF24' },
    background: { default: '#0B1410', paper: '#142019' },
    text: { primary: '#F8FAFC', secondary: '#CBD5E1' },
  };
  return createTheme({
    palette: mode === 'dark' ? darkPalette : lightPalette,
    shape: {
      borderRadius: 20,
    },
    spacing: 8,
    typography: {
      fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif',
      h1: { fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em' },
      h2: { fontSize: '2rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em' },
      h3: { fontSize: '1.625rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
      h4: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 },
      h5: { fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.35 },
      h6: { fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.4 },
      body1: { fontSize: '1rem', lineHeight: 1.65 },
      body2: { fontSize: '0.9rem', lineHeight: 1.6 },
      button: { fontWeight: 700 },
    },
    components: {
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: 20,
            paddingRight: 20,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 22,
            border: '1px solid rgba(15, 23, 42, 0.06)',
            boxShadow: mode === 'dark'
              ? '0 18px 40px rgba(0,0,0,0.24)'
              : '0 18px 40px rgba(15, 23, 42, 0.07)',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 999,
            fontWeight: 700,
            paddingLeft: 18,
            paddingRight: 18,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 22,
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 700,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
          },
        },
      },
    },
  });
};

function App() {
  const { userInfo } = useSelector((state) => state.userLogin || {});
  const preferredThemeMode = userInfo?.preferences?.theme || 'system';
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const themeMode = useMemo(() => {
    if (preferredThemeMode === 'system') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return preferredThemeMode;
  }, [preferredThemeMode, prefersDarkMode]);
  const theme = useMemo(() => getAppTheme(themeMode), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CustomThemeProvider>
        <I18nProvider>
            <SocketInitializer />
            <Routes>

              {/* --- AUTH --- */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
              <Route path="/resetpassword/:token" element={<ResetPasswordPage />} />

              {/* --- CUSTOMER DASHBOARD --- */}
              <Route
                path="/customer/dashboard"
                element={
                  <ProtectedRoute roles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* --- CUSTOMER PAGES --- */}
              <Route path="/products/:id" element={<ProtectedRoute><ProductPage /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/orders/success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
              <Route path="/bulk-order" element={<ProtectedRoute><BulkOrderPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/contact" element={<ProtectedRoute><ContactForm /></ProtectedRoute>} />
              <Route path="/verify-email-notice" element={<ProtectedRoute><VerifyEmailNotice /></ProtectedRoute>} />

              {/* --- SELLER --- */}
              <Route
                path="/seller/dashboard"
                element={<ProtectedRoute roles={['seller']}><SellerDashboard /></ProtectedRoute>}
              />
              <Route
                path="/seller/kyc"
                element={<ProtectedRoute roles={['seller']}><SellerKycPage /></ProtectedRoute>}
              />



              {/* --- ADMIN --- */}
              <Route
                path="/admin/dashboard"
                element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>}
              />
              <Route
                path="/admin/forum"
                element={<ProtectedRoute roles={['admin']}><AdminForumPanel /></ProtectedRoute>}
              />
              <Route
                path="/admin/delivery-kyc"
                element={<ProtectedRoute roles={['admin']}><DeliveryKYCApproval /></ProtectedRoute>}
              />
              <Route
                path="/admin/replacements"
                element={<ProtectedRoute roles={['admin']}><ReplacementManagement /></ProtectedRoute>}
              />

              {/* --- SELLER REPLACEMENT MANAGEMENT --- */}
              <Route
                path="/seller/replacements"
                element={<ProtectedRoute roles={['seller']}><ReplacementManagement /></ProtectedRoute>}
              />

              {/* --- COMMUNITY --- */}
              {/* 🔥 CRITICAL FIX: Forum routes allow all authenticated roles */}
              <Route path="/forum" element={<ProtectedRoute><ForumList /></ProtectedRoute>} />
              {/* 🔥 NEW: Dedicated route for viewing individual forum posts */}
              <Route path="/forum/post/:id" element={<ProtectedRoute><ForumPostDetail /></ProtectedRoute>} />
              <Route path="/forum/:id" element={<ProtectedRoute><ForumComments /></ProtectedRoute>} />
              <Route path="/forum/create" element={<ProtectedRoute><CreatePostForm /></ProtectedRoute>} />
              <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
              <Route path="/recipes" element={<ProtectedRoute><RecipeList /></ProtectedRoute>} />
              <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />

              {/* --- CUSTOMER SETTINGS (NESTED) --- */}
              <Route
                path="/settings"
                element={<ProtectedRoute roles={['customer']}><Settings /></ProtectedRoute>}
              >
                <Route index element={<Navigate to="profile" replace />} />

                {/* --- REAL COMPONENTS --- */}
                <Route path="profile" element={<Profile />} />
                <Route path="addresses" element={<AddressManager />} />
                <Route path="security" element={<SecuritySettings />} />
                <Route path="preferences" element={<PreferencesSettings />} />

                <Route path="notifications" element={<NotificationSettings />} />

                <Route path="language" element={<LanguageSettings />} />
                <Route path="theme" element={<ThemeMode />} />
                <Route path="accessibility" element={<AccessibilitySettings />} />
                <Route path="order-history" element={<OrderHistory />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="bookmarks" element={<Bookmarks />} />
                <Route path="refunds" element={<RefundsReturns />} />
                <Route path="invoices" element={<DownloadInvoices />} />
                <Route path="rewards" element={<RewardsWallet />} />
                <Route path="recommendations" element={<Recommendations />} />
                <Route path="privacy" element={<PrivacySettings />} />
                <Route path="help-center" element={<HelpCenter />} />
                <Route path="legal" element={<LegalPolicies />} />
                <Route path="about" element={<About />} />

                {/* --- Account Management --- */}
                <Route path="clear-cache" element={<AccountManagement />} />

                {/* --- Auth Actions --- */}
                <Route path="logout" element={<LogoutPage />} />
                <Route path="delete-account" element={<DeleteAccountPage />} />

                {/* --- PLACEHOLDERS (Future) --- */}
                <Route path="*" element={<SettingsPlaceholder title="Coming Soon" />} />
              </Route>

              {/* --- DEFAULT --- */}
              <Route 
                path="/" 
                element={
                  userInfo?.token ? (
                    <Navigate 
                      to={
                        userInfo.role === 'admin' ? '/admin/dashboard' :
                        userInfo.role === 'seller' ? (userInfo.kycStatus === 'approved' ? '/seller/dashboard' : '/seller/kyc') :
                        '/customer/dashboard'
                      } 
                      replace 
                    />
                  ) : (
                    <LoginPage />
                  )
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </I18nProvider>
      </CustomThemeProvider>
    </ThemeProvider>
  );
}

export default App;
