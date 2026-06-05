import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, clearAuthError } from '../../features/authSlice.js';
import axios from 'axios';
import { GitBranch, LogIn, Mail, Lock, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { apiPath } from '../../config/env.js';

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
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const oauthError = searchParams.get('error');

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(authStart());
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      dispatch(authSuccess(res.data));
      navigate('/dashboard');
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Login failed. Please check credentials.'));
    }
  };

  const handleForgotPasswordInitiate = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;

    try {
      await axios.post('/api/auth/forgot-password', { email: resetEmail });
      setSuccessMsg('Recovery code sent to your email.');
      setForgotStep(2);
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Password reset request failed.'));
    }
  };

  const handleForgotPasswordComplete = async (e) => {
    e.preventDefault();
    if (!resetEmail || !resetCode || !newPassword) return;

    try {
      await axios.post('/api/auth/reset-password', { email: resetEmail, code: resetCode, newPassword });
      setSuccessMsg('Password updated successfully! You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Resetting password failed.'));
    }
  };

  return (
    <div className="app-shell grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-[980px] overflow-hidden rounded-lg border bg-white shadow-2xl dark:bg-[#181d26]" style={{ borderColor: 'var(--app-border)' }}>
        <div className="grid min-h-[620px] lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="hidden border-r bg-slate-50 p-10 dark:bg-[#151922] lg:flex lg:flex-col lg:justify-between" style={{ borderColor: 'var(--app-border)' }}>
            <div>
              <div className="mb-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-white">
                <img src="/favicon.svg" alt="Orbitus" className="h-full w-full object-contain" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-app">Orbitus</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Where Skills Connect</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                Manage skill exchanges, AI matches, sessions, roadmaps and resume assets from one focused workspace.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-muted-strong">
              {['Verified mentor matching', 'Session and chat workflow', 'AI resume and roadmap tools'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
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
                <a href={apiPath('/api/auth/oauth/google')} className="btn-secondary justify-center">
                  <span className="text-base font-black">G</span>
                  <span>Google</span>
                </a>
                <a href={apiPath('/api/auth/oauth/github')} className="btn-secondary justify-center">
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-200">Password Recovery</h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep(1);
                  setSuccessMsg('');
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPasswordInitiate} className="space-y-4">
                <p className="text-sm text-slate-400">Enter your registered email address to receive a 6-digit verification code.</p>
                <div className="space-y-2">
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-200 outline-none"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 rounded-xl font-semibold text-white hover:bg-indigo-500 transition-all">
                  Send Recovery Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotPasswordComplete} className="space-y-4">
                <p className="text-sm text-slate-400">Enter the code sent to your email and select a secure new password.</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-200 outline-none text-center font-mono tracking-widest"
                  />
                  <div className="relative">
                    <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Secure new password"
                    className="field-input px-4 py-3 pr-12"
                  />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-app"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-indigo-600 rounded-xl font-semibold text-white hover:bg-indigo-500 transition-all">
                  Set New Password
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
