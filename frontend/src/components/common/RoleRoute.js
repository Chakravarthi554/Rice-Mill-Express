import React, { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from './Loader';

const ProtectedRoute = ({ children, roles }) => {
  const { userInfo: reduxUserInfo, loading } = useSelector(state => state.userLogin);
  const location = useLocation();

  // Fall back to localStorage when Redux state hasn't been hydrated yet
  // (e.g., immediately after registration before the store syncs)
  const userInfo = reduxUserInfo || (() => {
    try { return JSON.parse(localStorage.getItem('userInfo')); } catch { return null; }
  })();

  const isAuthenticated = !!userInfo?.token;

  // 🔥 CRITICAL FIX: Enhanced role checking with admin override
  const isAuthorized = useMemo(() => {
    if (!roles) return true;

    // Admin can access any route
    if (userInfo?.role === 'admin') {
      console.log(`✅ Admin ${userInfo._id} granted access to ${roles.join(', ')} routes`);
      return true;
    }

    return roles.includes(userInfo?.role);
  }, [roles, userInfo?.role]);

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    console.log(`🔐 ProtectedRoute (${location.pathname}): Not authenticated, redirecting to /login.`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    console.log(`❌ Unauthorized: User role ${userInfo?.role}, required: ${roles?.join(', ')}`);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Your role ({userInfo?.role}) does not have permission to access this page.</p>
        <p>Required roles: {roles?.join(', ')}</p>
      </div>
    );
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;