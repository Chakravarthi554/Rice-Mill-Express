import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { userInfo } = useSelector((state) => state.userLogin || {});
  const location = useLocation();

  // ✅ FIXED: Enhanced authentication check
  if (!userInfo) {
    console.log('🔐 ProtectedRoute: Not authenticated, redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ FIXED: Role-based access control
  if (roles.length > 0 && !roles.includes(userInfo.role)) {
    console.log(`❌ ProtectedRoute: User role ${userInfo.role} not authorized for ${roles.join(', ')}`);
    
    // Redirect based on user role
    const redirectPath = userInfo.role === 'admin' ? '/admin/dashboard' :
                        userInfo.role === 'seller' ? '/seller/dashboard' : 
                        '/customer/dashboard';
    
    return <Navigate to={redirectPath} replace />;
  }

  // ✅ FIXED: Seller KYC check
  if (userInfo.role === 'seller' && userInfo.kycStatus !== 'approved' && 
      !location.pathname.includes('/seller/kyc') &&
      !location.pathname.includes('/logout')) {
    console.log('🔐 ProtectedRoute: Seller KYC not approved, redirecting to KYC');
    return <Navigate to="/seller/kyc" replace />;
  }

  console.log(`✅ ProtectedRoute: Access granted for ${userInfo.role} to ${location.pathname}`);
  return children;
};

export default ProtectedRoute;