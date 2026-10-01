import express from 'express';
import {
  registerUser,
  verifyOtp,
  loginUser,
  refreshTokens,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  getPublicUserProfile,
  uploadProfileResume,
  viewUserResume,
  searchUsers,
  getSuggestedUsers,
  toggleFollowUser,
  getFollowersList,
  getFollowingList,
  startOAuth,
  handleOAuthCallback,
  deleteAccount,
  uploadMediaImage,
  verifyAdminKeyAndLogin
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { uploadResume, uploadImage } from '../middlewares/multer.js';

const router = express.Router();

router.post('/admin-login', verifyAdminKeyAndLogin);
router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/refresh', refreshTokens);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/oauth/:provider', startOAuth);
router.get('/oauth/:provider/callback', handleOAuthCallback);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post('/profile/resume', protect, uploadResume.single('resume'), uploadProfileResume);
router.post('/upload-image', protect, uploadImage.single('image'), uploadMediaImage);
router.delete('/account', protect, deleteAccount);
router.get('/search', protect, searchUsers);
router.get('/suggested', protect, getSuggestedUsers);
router.post('/:id/follow', protect, toggleFollowUser);
router.get('/:id/followers', protect, getFollowersList);
router.get('/:id/following', protect, getFollowingList);
router.get('/:id/resume', viewUserResume);
router.get('/:id', protect, getPublicUserProfile);

export default router;
