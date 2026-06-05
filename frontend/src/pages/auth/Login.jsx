import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { authStart, authSuccess, authFailure } from '../../features/authSlice';
import apiClient, { API_BASE_URL } from '../../services/apiClient';
import { LogIn, Mail, Lock, AlertCircle, Globe, Terminal } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const res = await apiClient.post('/api/auth/login', { email, password });
      dispatch(authSuccess(res.data));
      navigate('/dashboard');
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Login failed'));
    }
  };

  const handleOAuth = (provider) => {
    window.location.href = `${API_BASE_URL}/api/auth/oauth/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border-slate-800/60 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white font-outfit">Welcome Back</h1>
          <p className="text-slate-400 mt-2">Login to your Orbitus account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                required
                className="field-input pl-12 w-full"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                required
                className="field-input pl-12 w-full"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-70"
          >
            <LogIn size={18} />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-950 px-3 text-slate-500 font-bold">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleOAuth('google')}
            className="flex items-center justify-center gap-2 py-3 border border-slate-800 rounded-2xl text-slate-300 hover:bg-white/5 transition-all text-sm font-semibold"
          >
            <Globe size={18} /> Google
          </button>
          <button
            onClick={() => handleOAuth('github')}
            className="flex items-center justify-center gap-2 py-3 border border-slate-800 rounded-2xl text-slate-300 hover:bg-white/5 transition-all text-sm font-semibold"
          >
            <Terminal size={18} /> GitHub
          </button>
        </div>

        <p className="text-center mt-8 text-slate-500 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
            Sign Up Free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
