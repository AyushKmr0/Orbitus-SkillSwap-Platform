import express from 'express';
import {
  registerUser,
  verifyOtp,
  loginUser,
  refreshTokens,
  logoutUser,
  forgotPassword,
  resetPassword,
  startOAuth,
  handleOAuthCallback,
  verifyAdminKeyAndLogin
} from './auth.controller.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from './auth.schema.js';

const router = express.Router();

router.post('/admin-login', verifyAdminKeyAndLogin);
router.post('/verify-admin-key', verifyAdminKeyAndLogin);
router.get('/verify-admin-key', verifyAdminKeyAndLogin);
router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/refresh', refreshTokens);
router.post('/logout', logoutUser);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.get('/oauth/:provider', startOAuth);
router.get('/oauth/:provider/callback', handleOAuthCallback);

export default router;
