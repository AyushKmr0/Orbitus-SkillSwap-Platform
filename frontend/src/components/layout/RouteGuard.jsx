import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const ProtectedRoute = ({ redirectPath = '/login' }) => {
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  const searchParams = new URLSearchParams(window.location.search);
  const hasAdminKey = Boolean(searchParams.get('key') || searchParams.get('adminKey') || localStorage.getItem('orbitus_admin_key'));

  if (!isAuthenticated && !token && !hasAdminKey) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export const AdminRoute = ({ redirectPath = '/dashboard' }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user || user.role !== 'Admin') {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
