import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authSuccess, authFailure } from '../../features/authSlice.js';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const encodedUser = searchParams.get('user');

    if (!accessToken || !encodedUser) {
      dispatch(authFailure('Social login failed. Please try again.'));
      navigate('/login', { replace: true });
      return;
    }

    try {
      dispatch(authSuccess({
        accessToken,
        user: JSON.parse(encodedUser)
      }));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      dispatch(authFailure('Social login response was invalid.'));
      navigate('/login', { replace: true });
    }
  }, [dispatch, navigate, searchParams]);

  return (
    <div className="app-shell grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-200">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
        <p className="text-sm text-slate-400">Completing secure sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
