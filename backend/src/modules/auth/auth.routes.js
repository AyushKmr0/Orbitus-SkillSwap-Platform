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
  verifyAdminKeyAndLogin,
  sendPasswordOtp,
  updatePasswordWithOtp,
  requestEmailChange,
  verifyCurrentEmailChange,
  resendEmailChangeCode,
  verifyNewEmailChange,
  adminChangeSecretKey
} from './auth.controller.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordWithOtpSchema,
  emailChangeRequestSchema,
  emailChangeOtpSchema,
  adminChangeSecretKeySchema
} from './auth.schema.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';
import { auditAdminMutation } from '../../services/adminAuditService.js';
import { requireAdminPermission } from '../../middlewares/adminPermissions.js';
import { requireFeatureFlag } from '../../config/featureFlags.js';

const router = express.Router();

router.post('/admin-login', verifyAdminKeyAndLogin);
router.post('/verify-admin-key', verifyAdminKeyAndLogin);
router.get('/verify-admin-key', verifyAdminKeyAndLogin);
router.post('/register', requireFeatureFlag('userRegistration'), validateRequest(registerSchema), registerUser);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/refresh', refreshTokens);
router.post('/logout', logoutUser);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.get('/oauth/:provider', startOAuth);
router.get('/oauth/:provider/callback', handleOAuthCallback);

// Authenticated Password Management (OTP-verified)
router.post('/send-password-otp', protect, sendPasswordOtp);
router.post('/update-password-with-otp', protect, validateRequest(updatePasswordWithOtpSchema), updatePasswordWithOtp);
router.post('/email-change/request', protect, validateRequest(emailChangeRequestSchema), requestEmailChange);
router.post('/email-change/verify-current', protect, validateRequest(emailChangeOtpSchema), verifyCurrentEmailChange);
router.post('/email-change/resend', protect, resendEmailChangeCode);
router.post('/email-change/verify-new', protect, validateRequest(emailChangeOtpSchema), verifyNewEmailChange);

// Admin Master Secret Key Management
router.post('/admin-change-secret-key', protect, adminOnly, requireAdminPermission('system.manage'), auditAdminMutation('change_admin_secret_key'), validateRequest(adminChangeSecretKeySchema), adminChangeSecretKey);
router.put('/admin-change-secret-key', protect, adminOnly, requireAdminPermission('system.manage'), auditAdminMutation('change_admin_secret_key'), validateRequest(adminChangeSecretKeySchema), adminChangeSecretKey);
router.post('/change-secret-key', protect, adminOnly, requireAdminPermission('system.manage'), auditAdminMutation('change_admin_secret_key'), validateRequest(adminChangeSecretKeySchema), adminChangeSecretKey);
router.put('/change-secret-key', protect, adminOnly, requireAdminPermission('system.manage'), auditAdminMutation('change_admin_secret_key'), validateRequest(adminChangeSecretKeySchema), adminChangeSecretKey);

export default router;
