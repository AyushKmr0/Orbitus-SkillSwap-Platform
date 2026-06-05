import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { authSuccess } from '../../features/authSlice.js';
import { GitBranch, UserPlus, User, Mail, Lock, ShieldAlert, CheckCircle2, Eye, EyeOff, AtSign } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isRegistered, setIsRegistered] = useState(false); // Toggle to show OTP view
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
      const res = await axios.post('/api/auth/register', { name, username, email, password });
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
      const res = await axios.post('/api/auth/verify-otp', { email, code: otpCode });
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
    <div className="app-shell grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-[980px] overflow-hidden rounded-lg border bg-white shadow-2xl dark:bg-[#181d26]" style={{ borderColor: 'var(--app-border)' }}>
        <div className="grid min-h-[660px] lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="hidden border-r bg-slate-50 p-10 dark:bg-[#151922] lg:flex lg:flex-col lg:justify-between" style={{ borderColor: 'var(--app-border)' }}>
            <div>
              <div className="mb-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-white">
                <img src="/favicon.svg" alt="Orbitus" className="h-full w-full object-contain" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-app">Build your Orbitus profile</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Where Skills Connect</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                Add your account first, then use the catalog to define what you teach and what you want to learn.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4 text-sm text-muted dark:bg-[#181d26]" style={{ borderColor: 'var(--app-border)' }}>
              Orbitus uses email verification so mentors and learners can coordinate safely.
            </div>
          </aside>

          <main className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md fade-in-content">
              <div className="mb-8">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {isRegistered ? 'Verify email' : 'Create account'}
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-app">
                  {isRegistered ? 'Enter your verification code' : 'Start your Orbitus workspace'}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {isRegistered ? 'Use the OTP sent to your mailbox.' : 'Set up the account you will use for exchanges.'}
                </p>
              </div>

              {error && (
                <div className="mb-6 flex gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
                  <ShieldAlert size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-6 flex gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={18} className="flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {!isRegistered ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <a href="/api/auth/oauth/google" className="btn-secondary justify-center">
                      <span className="text-base font-black">G</span>
                      <span>Google</span>
                    </a>
                    <a href="/api/auth/oauth/github" className="btn-secondary justify-center">
                      <GitBranch size={18} />
                      <span>GitHub</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold uppercase text-muted">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    <span>Email signup</span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  </div>

                  {[
                    ['name', 'Full Name', 'John Doe', User, name, setName, 'text'],
                    ['username', 'Username', 'john_doe', AtSign, username, setUsername, 'text'],
                    ['email', 'Email Address', 'john@example.com', Mail, email, setEmail, 'email'],
                    ['password', 'Password', 'Password', Lock, password, setPassword, showPassword ? 'text' : 'password'],
                    ['confirmPassword', 'Confirm Password', 'Confirm password', Lock, confirmPassword, setConfirmPassword, showConfirmPassword ? 'text' : 'password']
                  ].map(([id, label, placeholder, Icon, value, setter, type]) => (
                    <div key={id} className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase text-muted">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type={type}
                          required
                          value={value}
                          onChange={(e) => setter(id === 'username' ? e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') : e.target.value)}
                          placeholder={placeholder}
                          className="field-input py-3 pl-11 pr-12 text-sm placeholder:text-slate-400"
                        />
                        {(id === 'password' || id === 'confirmPassword') && (
                          <button
                            type="button"
                            onClick={() => id === 'password' ? setShowPassword((value) => !value) : setShowConfirmPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-app"
                            title={type === 'text' ? 'Hide password' : 'Show password'}
                          >
                            {type === 'text' ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><UserPlus size={18} /><span>Register Now</span></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2 text-center">
                    <label className="text-xs font-semibold uppercase text-muted">6-Digit Verification Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      className="field-input px-4 py-4 text-center font-mono text-2xl tracking-[0.6em]"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Verify & Complete Setup'}
                  </button>
                </form>
              )}

              <p className="mt-8 text-center text-sm text-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
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
