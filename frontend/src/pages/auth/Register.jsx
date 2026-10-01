import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authSuccess } from '../../features/authSlice.js';
import { GitBranch, UserPlus, User, Mail, Lock, ShieldAlert, CheckCircle2, Eye, EyeOff, AtSign } from 'lucide-react';
import { apiPath } from '../../config/env.js';
import apiClient from '../../services/apiClient.js';

const Register = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/api/auth/register', { name, username, email, password });
      setSuccess(res.data.message);
      setIsRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/api/auth/verify-otp', { email, code: otpCode });
      setSuccess(res.data.message);
      dispatch(authSuccess(res.data));
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-[920px] my-auto overflow-hidden rounded-2xl border bg-white shadow-2xl dark:bg-[#22242a]" style={{ borderColor: 'var(--app-border)' }}>
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="hidden border-r bg-slate-50 p-8 dark:bg-[#151922] lg:flex lg:flex-col lg:justify-between" style={{ borderColor: 'var(--app-border)' }}>
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white shadow-xs">
                <img src="/favicon.svg" alt="Orbitus" className="h-full w-full object-contain p-2" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-app">Build your Orbitus profile</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Where Skills Connect</p>
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted">
                Add your account first, then use the catalog to define what you teach and what you want to learn.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-3.5 text-xs text-muted dark:bg-[#22242a]" style={{ borderColor: 'var(--app-border)' }}>
              Orbitus uses email verification so mentors and learners can coordinate safely.
            </div>
          </aside>

          <main className="flex items-center justify-center p-5 sm:p-7">
            <div className="w-full max-w-md fade-in-content">
              <div className="mb-5">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {isRegistered ? 'Verify email' : 'Create account'}
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-app">
                  {isRegistered ? 'Enter verification code' : 'Start your Orbitus workspace'}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {isRegistered ? 'Use the OTP sent to your mailbox.' : 'Set up the account you will use for exchanges.'}
                </p>
              </div>

              {error && (
                <div className="mb-4 flex gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-300">
                  <ShieldAlert size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 flex gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {!isRegistered ? (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <a href={`${apiPath('/api/auth/oauth/google')}?origin=${encodeURIComponent(window.location.origin)}`} className="btn-secondary justify-center py-2 text-xs">
                      <span className="text-sm font-black">G</span>
                      <span>Google</span>
                    </a>
                    <a href={`${apiPath('/api/auth/oauth/github')}?origin=${encodeURIComponent(window.location.origin)}`} className="btn-secondary justify-center py-2 text-xs">
                      <GitBranch size={16} />
                      <span>GitHub</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-muted">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    <span>Email signup</span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  </div>

                  {[
                    ['name', 'Full Name', 'Enter full name', User, name, setName, 'text'],
                    ['username', 'Username', 'Enter username', AtSign, username, setUsername, 'text'],
                    ['email', 'Email Address', 'name@example.com', Mail, email, setEmail, 'email'],
                    ['password', 'Password', 'Password', Lock, password, setPassword, showPassword ? 'text' : 'password'],
                    ['confirmPassword', 'Confirm Password', 'Confirm password', Lock, confirmPassword, setConfirmPassword, showConfirmPassword ? 'text' : 'password']
                  ].map(([id, label, placeholder, Icon, value, setter, type]) => (
                    <div key={id} className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-muted tracking-wider">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type={type}
                          required
                          value={value}
                          onChange={(e) => setter(id === 'username' ? e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') : e.target.value)}
                          placeholder={placeholder}
                          className="field-input py-2 pl-10 pr-10 text-xs placeholder:text-slate-400 rounded-xl"
                        />
                        {(id === 'password' || id === 'confirmPassword') && (
                          <button
                            type="button"
                            onClick={() => id === 'password' ? setShowPassword((value) => !value) : setShowConfirmPassword((value) => !value)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-app"
                            title={type === 'text' ? 'Hide password' : 'Show password'}
                          >
                            {type === 'text' ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs font-bold mt-1">
                    {loading ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><UserPlus size={16} /><span>Register Now</span></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2 text-center">
                    <label className="text-xs font-semibold uppercase text-muted">6-Digit Verification Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      className="field-input px-4 py-3 text-center font-mono text-xl tracking-[0.5em] rounded-xl"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-xs font-bold">
                    {loading ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Verify & Complete Setup'}
                  </button>
                </form>
              )}

              <p className="mt-5 text-center text-xs text-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Log In here
                </Link>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Register;
