import express from 'express';
import {
  submitFeedback,
  getMyFeedbacks,
  getAdminFeedbacks,
  updateFeedbackStatus,
  deleteFeedback
} from './feedback.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';
import { requireAdminPermission } from '../../middlewares/adminPermissions.js';
import { auditAdminMutation } from '../../services/adminAuditService.js';
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
router.get('/admin', protect, adminOnly, requireAdminPermission('feedback.manage'), validateRequest(adminFeedbackQuerySchema), getAdminFeedbacks);
router.put('/admin/:id/status', protect, adminOnly, requireAdminPermission('feedback.manage'), auditAdminMutation('update_feedback', 'feedback'), validateRequest(updateFeedbackStatusSchema), updateFeedbackStatus);
router.delete('/admin/:id', protect, adminOnly, requireAdminPermission('feedback.manage'), auditAdminMutation('delete_feedback', 'feedback'), validateRequest(feedbackIdParamSchema), deleteFeedback);

export default router;
