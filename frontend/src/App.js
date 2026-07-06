import React, { useMemo, lazy, Suspense } from 'react';
import RouteErrorBoundary from './components/common/RouteErrorBoundary';
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
import EnvBadge from './components/EnvBadge';
import './theme.css';

// --- Pages (Eagerly Loaded) ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// --- Pages (Lazy Loaded) ---
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SellerKycPage = lazy(() => import('./pages/seller/SellerKycPage'));
const AdminForumPanel = lazy(() => import('./components/admin/AdminForumPanel'));
const ProductPage = lazy(() => import('./pages/customer/ProductPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const OrderDetailPage = lazy(() => import('./pages/customer/OrderDetailPage'));
const BulkOrderPage = lazy(() => import('./pages/customer/BulkOrderPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage'));
const NotificationsPage = lazy(() => import('./pages/customer/NotificationsPage'));
const DeliveryKYCApproval = lazy(() => import('./components/admin/DeliveryKYCApproval'));
const OrderSuccessPage = lazy(() => import('./pages/customer/OrderSuccessPage'));
const VerifyEmailNotice = lazy(() => import('./pages/VerifyEmailNotice'));
const ProductsPage = lazy(() => import('./pages/customer/ProductsPage'));
// --- Replacement Components ---
const ReplacementManagement = lazy(() => import('./components/admin/ReplacementManagement'));

const AccountManagement = lazy(() => import('./components/customer/AccountManagement'));
const LogoutPage = lazy(() => import('./components/customer/LogoutPage'));
const DeleteAccountPage = lazy(() => import('./components/customer/DeleteAccountPage'));

// --- Community ---
const RecipeDetail = lazy(() => import('./components/common/RecipeDetail'));
const RecipeList = lazy(() => import('./components/common/RecipeList'));
const ForumList = lazy(() => import('./components/common/ForumList'));
const ForumPostDetail = lazy(() => import('./components/common/ForumPostDetail'));
const CreatePostForm = lazy(() => import('./components/common/CreatePostForm'));
const ForumComments = lazy(() => import('./components/common/ForumComments'));
const BookmarksPage = lazy(() => import('./pages/customer/BookmarksPage'));

// --- Settings Components ---
const Settings = lazy(() => import('./components/customer/Settings'));
const Profile = lazy(() => import('./components/customer/Profile'));
const AddressManager = lazy(() => import('./components/customer/AddressManager'));
const SecuritySettings = lazy(() => import('./components/customer/SecuritySettings'));
const PreferencesSettings = lazy(() => import('./components/customer/PreferencesSettings'));

// REAL Components
const LanguageSettings = lazy(() => import('./components/customer/LanguageSettings'));
const ThemeMode = lazy(() => import('./components/customer/ThemeMode'));
const AccessibilitySettings = lazy(() => import('./components/customer/AccessibilitySettings'));
const OrderHistory = lazy(() => import('./components/customer/MyOrders'));
const RefundsReturns = lazy(() => import('./components/customer/RefundsReturns'));
const DownloadInvoices = lazy(() => import('./components/customer/DownloadInvoices'));
const RewardsWallet = lazy(() => import('./components/customer/RewardsWallet'));
const Recommendations = lazy(() => import('./components/customer/Recommendations'));
const PrivacySettings = lazy(() => import('./components/customer/PrivacySettings'));
const HelpCenter = lazy(() => import('./components/customer/HelpCenter'));
const LegalPolicies = lazy(() => import('./components/customer/LegalPolicies'));
const ContactForm = lazy(() => import('./components/customer/ContactForm'));
const NotificationSettings = lazy(() => import('./components/customer/NotificationSettings'));
const Reviews = lazy(() => import('./components/customer/Reviews'));
const About = lazy(() => import('./components/customer/About'));
const Bookmarks = lazy(() => import('./components/customer/Bookmarks'));

// Placeholder for future
const SettingsPlaceholder = lazy(() => import('./components/customer/SettingsPlaceholder'));


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
          <main id="main-content" role="main">
          <Suspense fallback={<div role="status" aria-label="Loading page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>}>
          <Routes>

            {/* --- AUTH --- */}
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
            <Route path="/resetpassword/:token" element={<ResetPasswordPage />} />

            {/* --- CUSTOMER DASHBOARD --- */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute roles={['customer']}>
                  <RouteErrorBoundary><CustomerDashboard /></RouteErrorBoundary>
                </ProtectedRoute>
              }
            />

            {/* --- CUSTOMER PAGES --- */}
            <Route path="/products" element={<ProtectedRoute><RouteErrorBoundary><ProductsPage /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/products/:id" element={<ProtectedRoute><RouteErrorBoundary><ProductPage /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><RouteErrorBoundary><CartPage /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><RouteErrorBoundary><WishlistPage /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><RouteErrorBoundary><CheckoutPage /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><RouteErrorBoundary><OrderDetailPage /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/orders/success" element={<ProtectedRoute><RouteErrorBoundary><OrderSuccessPage /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/bulk-order" element={<ProtectedRoute><RouteErrorBoundary><BulkOrderPage /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><RouteErrorBoundary><NotificationsPage /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><RouteErrorBoundary><ContactForm /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/verify-email-notice" element={<ProtectedRoute><RouteErrorBoundary><VerifyEmailNotice /></RouteErrorBoundary></ProtectedRoute>} />

            {/* --- SELLER --- */}
            <Route
              path="/seller/dashboard"
              element={<ProtectedRoute roles={['seller']}><RouteErrorBoundary><SellerDashboard /></RouteErrorBoundary></ProtectedRoute>}
            />
            <Route
              path="/seller/kyc"
              element={<ProtectedRoute roles={['seller']}><RouteErrorBoundary><SellerKycPage /></RouteErrorBoundary></ProtectedRoute>}
            />

            {/* --- DELIVERY --- */}
            <Route
              path="/delivery/dashboard"
              element={<ProtectedRoute roles={['deliveryPartner']}><RouteErrorBoundary><DeliveryDashboard /></RouteErrorBoundary></ProtectedRoute>}
            />

            {/* --- ADMIN --- */}
            <Route
              path="/admin/dashboard"
              element={<ProtectedRoute roles={['admin']}><RouteErrorBoundary><AdminDashboard /></RouteErrorBoundary></ProtectedRoute>}
            />
            <Route
              path="/admin/forum"
              element={<ProtectedRoute roles={['admin']}><RouteErrorBoundary><AdminForumPanel /></RouteErrorBoundary></ProtectedRoute>}
            />
            <Route
              path="/admin/delivery-kyc"
              element={<ProtectedRoute roles={['admin']}><RouteErrorBoundary><DeliveryKYCApproval /></RouteErrorBoundary></ProtectedRoute>}
            />
            <Route
              path="/admin/replacements"
              element={<ProtectedRoute roles={['admin']}><RouteErrorBoundary><ReplacementManagement /></RouteErrorBoundary></ProtectedRoute>}
            />

            {/* --- SELLER REPLACEMENT MANAGEMENT --- */}
            <Route
              path="/seller/replacements"
              element={<ProtectedRoute roles={['seller']}><RouteErrorBoundary><ReplacementManagement /></RouteErrorBoundary></ProtectedRoute>}
            />

            {/* --- COMMUNITY --- */}
            {/* 🔥 CRITICAL FIX: Forum routes allow all authenticated roles */}
            <Route path="/forum" element={<ProtectedRoute><RouteErrorBoundary><ForumList /></RouteErrorBoundary></ProtectedRoute>} />
            {/* 🔥 NEW: Dedicated route for viewing individual forum posts */}
            <Route path="/forum/post/:id" element={<ProtectedRoute><RouteErrorBoundary><ForumPostDetail /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/forum/:id" element={<ProtectedRoute><RouteErrorBoundary><ForumComments /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/forum/create" element={<ProtectedRoute><RouteErrorBoundary><CreatePostForm /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/bookmarks" element={<ProtectedRoute><RouteErrorBoundary><BookmarksPage /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/recipes" element={<ProtectedRoute><RouteErrorBoundary><RecipeList /></RouteErrorBoundary></ProtectedRoute>} />
            <Route path="/recipes/:id" element={<ProtectedRoute><RouteErrorBoundary><RecipeDetail /></RouteErrorBoundary></ProtectedRoute>} />

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
                          userInfo.role === 'deliveryPartner' ? '/delivery/dashboard' :
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
          </Suspense>
          </main>
          <EnvBadge />
        </I18nProvider>
      </CustomThemeProvider>
    </ThemeProvider>
  );
}

export default App;
