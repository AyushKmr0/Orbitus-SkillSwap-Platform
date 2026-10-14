import express from 'express';
import {
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
  deleteAccount,
  uploadMediaImage
} from './users.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { uploadResume, uploadImage } from '../../middlewares/multer.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  updateProfileSchema,
  deleteAccountSchema,
  searchUsersQuerySchema,
  suggestedUsersQuerySchema
} from './users.schema.js';

const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validateRequest(updateProfileSchema), updateUserProfile);

router.post('/profile/resume', protect, uploadResume.single('resume'), uploadProfileResume);
router.post('/upload-image', protect, uploadImage.single('image'), uploadMediaImage);
router.delete('/account', protect, validateRequest(deleteAccountSchema), deleteAccount);
router.get('/search', protect, validateRequest(searchUsersQuerySchema), searchUsers);
router.get('/suggested', protect, validateRequest(suggestedUsersQuerySchema), getSuggestedUsers);
router.post('/:id/follow', protect, toggleFollowUser);
router.get('/:id/followers', protect, getFollowersList);
router.get('/:id/following', protect, getFollowingList);
router.get('/:id/resume', viewUserResume);
router.get('/:id', protect, getPublicUserProfile);

export default router;
