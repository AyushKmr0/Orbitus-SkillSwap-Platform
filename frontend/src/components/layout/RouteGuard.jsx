import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShieldAlert } from 'lucide-react';
import apiClient from '../../services/apiClient.js';
import { authSuccess } from '../../features/authSlice.js';

export const isAdminUser = (user) => String(user?.role || '').trim().toLowerCase() === 'admin';

export const ProtectedRoute = ({ redirectPath = '/login' }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const hasAdminKey = !!(searchParams.get('key') || searchParams.get('adminKey'));

  if (!isAuthenticated && !hasAdminKey) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectPath}?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
};

export const AdminRoute = ({ redirectPath = '/dashboard' }) => {
  const { user, token, loading } = useSelector((state) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();

  const searchParams = new URLSearchParams(location.search);
  const adminKey = searchParams.get('key') || searchParams.get('adminKey');

  const [verifyingKey, setVerifyingKey] = useState(!!adminKey && !isAdminUser(user));
  const [keyError, setKeyError] = useState(null);

  useEffect(() => {
    if (adminKey && !isAdminUser(user)) {
      let isMounted = true;
      setVerifyingKey(true);
      setKeyError(null);

      apiClient
        .post('/api/auth/verify-admin-key', { key: adminKey })
        .then((res) => {
          if (isMounted) {
            const data = res.data?.data || res.data;
            dispatch(authSuccess(data));
            setVerifyingKey(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setKeyError(err.response?.data?.message || 'Invalid administrator master key');
            setVerifyingKey(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [adminKey, user, dispatch]);

  if (verifyingKey || (adminKey && !isAdminUser(user) && !keyError)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-app">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-muted">Authenticating Master Admin Key...</p>
      </div>
    );
  }

  if (adminKey && keyError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-app p-6 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-base font-bold text-app">Admin Access Denied</h2>
        <p className="text-xs text-muted leading-relaxed">{keyError}</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => { window.location.href = '/login?redirect=/admin'; }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Log In as Admin
          </button>
          <button
            onClick={() => { window.location.href = '/dashboard'; }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-muted hover:text-app rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!token && !user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdminUser(user)) {
    return <Navigate to={redirectPath} replace state={{ from: location, unauthorized: true }} />;
  }

  return <Outlet />;
};
