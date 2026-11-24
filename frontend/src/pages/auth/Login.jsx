import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, clearAuthError } from '../../features/authSlice.js';
import { GitBranch, LogIn, Mail, Lock, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { apiPath } from '../../config/env.js';
import apiClient from '../../services/apiClient.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Send email, 2: Reset password
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const oauthError = searchParams.get('error');
  const redirectTarget = searchParams.get('redirect');

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated) {
      if (redirectTarget && redirectTarget.startsWith('/')) {
        navigate(redirectTarget, { replace: true });
      } else {
        const isAdmin = String(user?.role || '').trim().toLowerCase() === 'admin';
        navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, redirectTarget, navigate, dispatch]);

  useEffect(() => {
    const key = searchParams.get('key') || searchParams.get('adminKey');
    let effectiveKey = key;
    if (!effectiveKey && redirectTarget) {
      try {
        const parsed = new URL(redirectTarget, 'http://localhost');
        effectiveKey = parsed.searchParams.get('key') || parsed.searchParams.get('adminKey');
      } catch {
        // ignore
      }
    }
    if (effectiveKey) {
      apiClient
        .post('/api/auth/verify-admin-key', { key: effectiveKey })
        .then((res) => {
          const data = res.data?.data || res.data;
          dispatch(authSuccess(data));
          navigate('/admin', { replace: true });
        })
        .catch(() => {
          // invalid key, stay on login
        });
    }
  }, [searchParams, redirectTarget, dispatch, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(authStart());
    try {
      const res = await apiClient.post('/api/auth/login', { email, password });
      dispatch(authSuccess(res.data));
      const loggedUser = res.data?.user || res.data;
      const isAdmin = String(loggedUser?.role || '').trim().toLowerCase() === 'admin';
      const target = (redirectTarget && redirectTarget.startsWith('/'))
        ? redirectTarget
        : (isAdmin ? '/admin' : '/dashboard');
      navigate(target, { replace: true });
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Login failed. Please check credentials.'));
    }
  };

  const handleForgotPasswordInitiate = async (e) => {
    e?.preventDefault?.();
    if (!resetEmail) return;

    setModalLoading(true);
    setModalError("");
    setSuccessMsg("");

    try {
      const res = await apiClient.post("/api/auth/forgot-password", { email: resetEmail });
      setSuccessMsg(res.data?.message || "6-digit recovery OTP sent to your email.");
      setForgotStep(2);
      setResendCooldown(60);
    } catch (err) {
      setModalError(err.response?.data?.message || "Password recovery request failed.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleForgotPasswordComplete = async (e) => {
    e?.preventDefault?.();
    if (!resetEmail || !resetCode || !newPassword) return;

    if (newPassword.length < 6) {
      setModalError("Password must be at least 6 characters long.");
      return;
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      setModalError("New password and confirmation do not match.");
      return;
    }

    setModalLoading(true);
    setModalError("");
    setSuccessMsg("");

    try {
      const res = await apiClient.post("/api/auth/reset-password", {
        email: resetEmail,
        code: resetCode.trim(),
        newPassword
      });
      setSuccessMsg(res.data?.message || "Password reset successfully! You can now log in.");
      setEmail(resetEmail);
      setPassword("");
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setResetEmail("");
        setResetCode("");
        setNewPassword("");
        setConfirmNewPassword("");
        setSuccessMsg("");
        setModalError("");
      }, 2000);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to reset password. Please check your code.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="app-shell grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-[980px] overflow-hidden rounded-lg border bg-white shadow-2xl dark:bg-[#22242a]" style={{ borderColor: 'var(--app-border)' }}>
        <div className="grid min-h-[620px] lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="hidden border-r bg-slate-50 p-10 dark:bg-[#151922] lg:flex lg:flex-col lg:justify-between" style={{ borderColor: 'var(--app-border)' }}>
            <div>
              <div className="mb-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-white">
                <BrandLogo size={56} className="h-full w-full object-contain" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-app">Orbitus</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Where Skills Connect</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                Manage skill exchanges, AI matches, sessions, roadmaps and resume assets from one focused workspace.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-muted-strong">
              {['Verified mentor matching', 'Session and chat workflow', 'AI resume and roadmap tools'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <main className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md fade-in-content">
              <div className="mb-8">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Welcome back</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-app">Log in to your workspace</h2>
                <p className="mt-2 text-sm text-muted">Continue your learning exchange without the noise.</p>
              </div>

              {error && (
                <div className="mb-6 flex gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
                  <ShieldAlert size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {oauthError && (
                <div className="mb-6 flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                  <ShieldAlert size={18} className="flex-shrink-0" />
                  <span>{oauthError === 'missing_config' ? 'Google/GitHub login needs OAuth client env setup on the backend.' : 'Social login failed. Please try again.'}</span>
                </div>
              )}

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <a href={`${apiPath('/api/auth/oauth/google')}?origin=${encodeURIComponent(window.location.origin)}`} className="btn-secondary justify-center">
                  <span className="text-base font-black">G</span>
                  <span>Google</span>
                </a>
                <a href={`${apiPath('/api/auth/oauth/github')}?origin=${encodeURIComponent(window.location.origin)}`} className="btn-secondary justify-center">
                  <GitBranch size={18} />
                  <span>GitHub</span>
                </a>
              </div>

              <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase text-muted">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span>Email login</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="field-input py-3.5 pl-11 pr-4 text-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase text-muted">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        dispatch(clearAuthError());
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="field-input py-3.5 pl-11 pr-12 text-sm placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-app"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><LogIn size={18} /><span>Log In</span></>}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-muted">
                New to Orbitus?{' '}
                <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Create an Account
                </Link>
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div data-modal="true" className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181d28] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl text-app">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-app font-outfit">Password Recovery</h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep(1);
                  setSuccessMsg("");
                  setModalError("");
                }}
                className="text-slate-400 hover:text-app p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {modalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPasswordInitiate} className="space-y-4">
                <p className="text-xs text-muted leading-relaxed">
                  Enter your registered account email. We will send you a 6-digit OTP verification code to reset your password.
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-app text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={modalLoading || !resetEmail}
                  className="w-full py-2.5 bg-indigo-600 rounded-xl font-bold text-xs text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {modalLoading ? "Sending OTP Code..." : "Send Recovery Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotPasswordComplete} className="space-y-3.5">
                <p className="text-xs text-muted leading-relaxed">
                  Enter the 6-digit OTP code sent to <strong className="text-app">{resetEmail}</strong> and your new password.
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">6-Digit OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-app text-sm font-mono tracking-widest text-center outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters..."
                      className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-app text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-app p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter password..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-app text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || modalLoading}
                    onClick={handleForgotPasswordInitiate}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend OTP Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForgotStep(1); setModalError(""); }}
                    className="text-muted hover:text-app"
                  >
                    Change Email
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={modalLoading || !resetCode || !newPassword}
                  className="w-full py-2.5 bg-indigo-600 rounded-xl font-bold text-xs text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {modalLoading ? "Resetting Password..." : "Set New Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
