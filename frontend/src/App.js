import React, { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  useMediaQuery,
  CssBaseline,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { AuthProvider } from './context/AuthContext';
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

import AccountManagement from './components/customer/AccountManagement';
import LogoutPage from './components/customer/LogoutPage';
import DeleteAccountPage from './components/customer/DeleteAccountPage';

// --- Community ---
import RecipeDetail from './components/common/RecipeDetail';
import RecipeList from './components/common/RecipeList';
import ForumList from './components/common/ForumList';
import CreatePostForm from './components/common/CreatePostForm';
import ForumComments from './components/common/ForumComments';

// --- Settings Components ---
import Settings from './components/customer/Settings';
import Profile from './components/customer/Profile';
import AddressManager from './components/customer/AddressManager';
import SecuritySettings from './components/customer/SecuritySettings';
import PreferencesSettings from './components/customer/PreferencesSettings';
import PersonalizationSettings from './components/customer/PersonalizationSettings';
import ReferralKycSettings from './components/customer/ReferralKycSettings';

// REAL Components (NOT placeholders)
import LanguageSettings from './components/customer/LanguageSettings';
import ThemeMode from './components/customer/ThemeMode';
import AccessibilitySettings from './components/customer/AccessibilitySettings';
import OrderHistory from './components/customer/OrderHistory';
import RefundsReturns from './components/customer/RefundsReturns';
import DownloadInvoices from './components/customer/DownloadInvoices';
import RewardsWallet from './components/customer/RewardsWallet';
import Subscription from './components/customer/Subscription';
import Recommendations from './components/customer/Recommendations';
import PrivacySettings from './components/customer/PrivacySettings';
import HelpCenter from './components/customer/HelpCenter';
import LegalPolicies from './components/customer/LegalPolicies';

// Placeholder for future
import SettingsPlaceholder from './components/customer/SettingsPlaceholder';

// ============================================================
// THEME CONFIGURATION
// ============================================================
const getAppTheme = (mode) => {
  const lightPalette = {
    primary: { main: '#2e7d32' },
    secondary: { main: '#ff8f00' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  };
  const darkPalette = {
    mode: 'dark',
    primary: { main: '#66bb6a' },
    secondary: { main: '#ffa726' },
    background: { default: '#303030', paper: '#424242' },
  };
  return createTheme({
    palette: mode === 'dark' ? darkPalette : lightPalette,
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
          <AuthProvider>
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

              {/* --- COMMUNITY --- */}
              {/* 🔥 CRITICAL FIX: Forum routes allow all authenticated roles */}
              <Route path="/forum" element={<ProtectedRoute><ForumList /></ProtectedRoute>} />
              <Route path="/forum/:id" element={<ProtectedRoute><ForumComments /></ProtectedRoute>} />
              <Route path="/forum/create" element={<ProtectedRoute><CreatePostForm /></ProtectedRoute>} />
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
                <Route path="personalization" element={<PersonalizationSettings />} />
                <Route path="referrals-kyc" element={<ReferralKycSettings />} />
                <Route path="notifications" element={<NotificationsPage />} />

                <Route path="language" element={<LanguageSettings />} />
                <Route path="theme" element={<ThemeMode />} />
                <Route path="accessibility" element={<AccessibilitySettings />} />
                <Route path="order-history" element={<OrderHistory />} />
                <Route path="refunds" element={<RefundsReturns />} />
                <Route path="invoices" element={<DownloadInvoices />} />
                <Route path="rewards" element={<RewardsWallet />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="recommendations" element={<Recommendations />} />
                <Route path="privacy" element={<PrivacySettings />} />
                <Route path="help-center" element={<HelpCenter />} />
                <Route path="legal" element={<LegalPolicies />} />

                {/* --- Account Management --- */}
                <Route path="clear-cache" element={<AccountManagement />} />

                {/* --- Auth Actions --- */}
                <Route path="logout" element={<LogoutPage />} />
                <Route path="delete-account" element={<DeleteAccountPage />} />

                {/* --- PLACEHOLDERS (Future) --- */}
                <Route path="*" element={<SettingsPlaceholder title="Coming Soon" />} />
              </Route>

              {/* --- DEFAULT --- */}
              <Route path="/" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </I18nProvider>
      </CustomThemeProvider>
    </ThemeProvider>
  );
}

export default App;