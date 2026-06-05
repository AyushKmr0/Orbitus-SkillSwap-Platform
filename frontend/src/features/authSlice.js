import { createSlice } from '@reduxjs/toolkit';

const initialUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
const initialToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';

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
      state.loading = false;
      state.token = action.payload.accessToken;
      state.user = action.payload.user || state.user;
      state.isAuthenticated = !!state.user;
      
      localStorage.setItem('accessToken', action.payload.accessToken);
      if (action.payload.user) {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
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
