import express from 'express';
import {
  submitFeedback,
  getMyFeedbacks,
  getAdminFeedbacks,
  updateFeedbackStatus,
  deleteFeedback
} from './feedback.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  submitFeedbackSchema,
  updateFeedbackStatusSchema,
  feedbackIdParamSchema,
  adminFeedbackQuerySchema
} from './feedback.schema.js';

const router = express.Router();

router.post('/', protect, validateRequest(submitFeedbackSchema), submitFeedback);
router.get('/my', protect, getMyFeedbacks);

// Admin-only endpoints
router.get('/admin', protect, adminOnly, validateRequest(adminFeedbackQuerySchema), getAdminFeedbacks);
router.put('/admin/:id/status', protect, adminOnly, validateRequest(updateFeedbackStatusSchema), updateFeedbackStatus);
router.delete('/admin/:id', protect, adminOnly, validateRequest(feedbackIdParamSchema), deleteFeedback);

export default router;
