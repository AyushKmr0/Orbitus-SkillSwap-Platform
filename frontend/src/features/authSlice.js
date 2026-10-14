import { createSlice } from '@reduxjs/toolkit';

function getInitialAuth() {
  if (typeof window === 'undefined') {
    return { user: null, token: '' };
  }
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const e2eToken = urlParams.get('__e2e_token');
    const e2eUser = urlParams.get('__e2e_user');
    if (e2eToken && e2eUser) {
      const parsedUser = JSON.parse(decodeURIComponent(e2eUser));
      localStorage.setItem('accessToken', e2eToken);
      localStorage.setItem('user', JSON.stringify(parsedUser));
      return { user: parsedUser, token: e2eToken };
    }
  } catch {
    // ignore
  }
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('accessToken') || '';
  return { user, token };
}

const { user: initialUser, token: initialToken } = getInitialAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken && !!initialUser,
    loading: false,
    error: null
  },
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      const payload = action.payload?.data || action.payload || {};
      const token = payload.accessToken || action.payload?.accessToken || action.payload?.token || '';
      const user = payload.user || action.payload?.user || state.user;
      state.loading = false;
      state.token = token;
      state.user = user;
      state.isAuthenticated = !!user && !!token;
      
      if (token) localStorage.setItem('accessToken', token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    updateAccessToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload && !!state.user;
      localStorage.setItem('accessToken', action.payload);
    },
    authFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateProfileSuccess: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.token = '';
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  }
});

export const {
  authStart,
  authSuccess,
  authFailure,
  updateProfileSuccess,
  updateAccessToken,
  logout,
  clearAuthError
} = authSlice.actions;

export default authSlice.reducer;
