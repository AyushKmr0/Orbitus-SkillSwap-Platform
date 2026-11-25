import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Key, User, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '../../services/apiClient.js';
import { showDailyLoginToast } from '../../lib/dailyLoginToast.js';
import { authSuccess } from '../../features/authSlice.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import { useDocumentHead } from '../../hooks/useDocumentHead.js';

const AdminLogin = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useDocumentHead({
    title: 'Administrator Portal — Orbitus SkillSwap',
    description: 'Secure administrator authentication portal for Orbitus platform control console.'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanSecretKey = secretKey.trim();

    if (!cleanUsername) {
      setErrorMsg('Please enter your administrator username or email.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your administrator password.');
      return;
    }
    if (!cleanSecretKey) {
      setErrorMsg('Please enter the administrator master secret key.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/api/auth/admin-login', {
        username: cleanUsername,
        email: cleanUsername.includes('@') ? cleanUsername : undefined,
        password,
        secretKey: cleanSecretKey,
        key: cleanSecretKey
      });

      const payload = res.data?.data || res.data;
      dispatch(authSuccess(payload));
      showDailyLoginToast({
        dailyReward: payload?.dailyReward,
        user: payload?.user,
        fallbackTitle: 'Administrator authenticated',
        fallbackDescription: 'Master control console unlocked successfully.'
      });

      if (onSuccess) {
        onSuccess(payload);
      } else {
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Authentication failed. Please verify your username, password, and secret key.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-[#0f1218] text-slate-900 dark:text-slate-100 transition-colors">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <BrandLogo size={34} />
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Orbitus
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
              Admin
            </span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Administrator Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your credentials and master secret key to unlock the control console.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-[#181d26] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5 relative overflow-hidden">
          {/* Subtle Security Badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Restricted Access Control</span>
            </div>
            <span className="text-[10px] font-mono tracking-wider font-bold uppercase opacity-80">
              3-Factor Key
            </span>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs leading-relaxed"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Administrator Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User size={16} />
                </div>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or admin@orbitus.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141a] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Administrator Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141a] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Master Secret Key */}
            <div>
              <label
                htmlFor="admin-secret-key"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Admin Master Secret Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Key size={16} />
                </div>
                <input
                  id="admin-secret-key"
                  type={showSecretKey ? 'text' : 'password'}
                  autoComplete="off"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter master secret key..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#12141a] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  aria-label={showSecretKey ? 'Hide secret key' : 'Show secret key'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showSecretKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Administrator Access...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Authenticate & Open Admin Panel</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Return to Orbitus Platform</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
