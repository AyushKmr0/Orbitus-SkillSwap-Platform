import express from 'express';
import {
  submitFeedback,
  getMyFeedbacks,
  getAdminFeedbacks,
  updateFeedbackStatus,
  deleteFeedback
} from '../controllers/feedbackController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, submitFeedback);
router.get('/my', protect, getMyFeedbacks);

// Admin-only endpoints
router.get('/admin', protect, adminOnly, getAdminFeedbacks);
router.put('/admin/:id/status', protect, adminOnly, updateFeedbackStatus);
router.delete('/admin/:id', protect, adminOnly, deleteFeedback);

export default router;
